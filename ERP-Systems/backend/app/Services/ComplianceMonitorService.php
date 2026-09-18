<?php

namespace App\Services;

use App\Models\HrComplianceAlert;
use App\Models\HrEmployee;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * مراقب الامتثال — معاد كتابته على جداولك.
 *
 * بيترجم الامتثال من "شغل ورق" إلى رقم مخاطرة بالريال.
 *
 * ====== تغييرات عن النسخة السابقة ======
 * - بيستخدم HrFieldResolver لمفتاح الموظف
 * - بيتحقق من وجود الأعمدة قبل المسح (Schema::hasColumn)
 * - بيقرأ gross_salary من العقد بدل تجميع البدلات
 *
 * التشغيل اليومي:
 *   $schedule->call(fn () => app(ComplianceMonitorService::class)->scan())
 *       ->dailyAt('06:00');
 */
class ComplianceMonitorService
{
    private const WPS_PENALTY_PER_EMPLOYEE = 3000;
    private const WPS_DEADLINE_DAY = 15;

    public function scan(): array
    {
        $generated = [];

        // كل مسح بيتحقق من أعمدته أولًا — فمفيش خطأ لو الهجرة متنفذتش
        if (Schema::hasColumn('hr_employees', 'iqama_expiry')) {
            $generated['iqama_expiry'] = $this->scanIqamaExpiry();
            $generated['passport_expiry'] = $this->scanPassportExpiry();
        }

        if (Schema::hasColumn('hr_employee_contracts', 'qiwa_authenticated_at')) {
            $generated['qiwa_not_authenticated'] = $this->scanQiwa();
        }

        if (Schema::hasColumn('hr_employees', 'gosi_number')) {
            $generated['gosi_unregistered'] = $this->scanGosi();
        }

        $generated['contract_expiry'] = $this->scanContractExpiry();
        $generated['salary_mismatch'] = $this->scanSalaryMismatch();
        $generated['probation_ending'] = $this->scanProbation();
        $generated['wps_deadline'] = $this->scanWpsDeadline();

        return [
            'scanned_at' => now()->toDateTimeString(),
            'generated' => $generated,
            'total' => array_sum($generated),
        ];
    }

    public function dashboard(): array
    {
        $alerts = HrComplianceAlert::where('status', 'open')->get();

        $employees = HrEmployee::query()
            ->whereIn('status', ['active', 'probation'])
            ->where('is_active', true)
            ->get(['id', 'nationality_type']);

        $total = $employees->count();

        $saudis = Schema::hasColumn('hr_employees', 'nationality_type')
            ? $employees->where('nationality_type', '!=', 'expat')->count()
            : 0;

        return [
            'alerts' => [
                'critical' => $alerts->where('severity', 'critical')->count(),
                'warning' => $alerts->where('severity', 'warning')->count(),
                'info' => $alerts->where('severity', 'info')->count(),
                'total' => $alerts->count(),
            ],

            // إجمالي المخاطرة المالية المفتوحة بالريال
            'financial_exposure' => round((float) $alerts->sum('potential_penalty'), 2),

            'by_type' => $alerts->groupBy('type')->map(fn ($g) => [
                'count' => $g->count(),
                'penalty' => round((float) $g->sum('potential_penalty'), 2),
            ]),

            'saudization' => [
                'total_employees' => $total,
                'saudi_employees' => $saudis,
                'percentage' => $total > 0 ? round(($saudis / $total) * 100, 2) : 0,

                /*
                 * ⚠ من ١٥ أبريل ٢٠٢٦: الموظف السعودي لا يُحسب في
                 * نطاقات إلا لو عقده موثّق إلكترونيًا على قوى.
                 * فالنسبة فوق تفاؤلية — دي الحقيقية.
                 */
                'countable_saudi_employees' => $this->countableSaudis(),
                'uncounted_reason' => 'عقود غير موثّقة في قوى',
            ],

            'wps' => $this->wpsStatus(),
        ];
    }

    private function scanIqamaExpiry(): int
    {
        $count = 0;

        $rows = HrEmployee::query()
            ->whereIn('status', ['active', 'probation', 'on_leave'])
            ->whereNotNull('iqama_expiry')
            ->where('iqama_expiry', '<=', now()->addDays(90))
            ->get();

        foreach ($rows as $employee) {
            $days = now()->startOfDay()->diffInDays(
                Carbon::parse($employee->iqama_expiry), false
            );

            $this->upsert([
                'type' => 'iqama_expiry',
                'employee_id' => $employee->id,
                'severity' => $days <= 30 ? 'critical' : 'warning',
                'title' => $days < 0
                    ? 'إقامة منتهية'
                    : "إقامة تنتهي خلال {$days} يوم",
                'description' => sprintf(
                    'الموظف %s — رقم الإقامة %s — الانتهاء %s.%s',
                    $employee->employee_number,
                    $employee->iqama_number ?: '—',
                    $employee->iqama_expiry,
                    $days < 0 ? ' انتهاء الإقامة يوقف الرواتب ونقل الكفالة.' : ''
                ),
                'due_date' => $employee->iqama_expiry,
                'days_remaining' => $days,
            ]);

            $count++;
        }

        return $count;
    }

    private function scanPassportExpiry(): int
    {
        $count = 0;

        $rows = HrEmployee::query()
            ->whereIn('status', ['active', 'probation', 'on_leave'])
            ->whereNotNull('passport_expiry')
            ->where('passport_expiry', '<=', now()->addDays(180))
            ->get();

        foreach ($rows as $employee) {
            $days = now()->startOfDay()->diffInDays(
                Carbon::parse($employee->passport_expiry), false
            );

            $this->upsert([
                'type' => 'passport_expiry',
                'employee_id' => $employee->id,
                'severity' => $days <= 60 ? 'warning' : 'info',
                'title' => "جواز سفر ينتهي خلال {$days} يوم",
                'description' => 'تجديد الإقامة يتطلب جوازًا ساريًا لمدة كافية.',
                'due_date' => $employee->passport_expiry,
                'days_remaining' => $days,
            ]);

            $count++;
        }

        return $count;
    }

    private function scanContractExpiry(): int
    {
        $count = 0;
        $key = HrFieldResolver::employeeKey('hr_employee_contracts');

        $hasNotice = Schema::hasColumn('hr_employee_contracts', 'notice_period_days');

        $rows = DB::table('hr_employee_contracts as c')
            ->join('hr_employees as e', 'e.id', '=', "c.{$key}")
            ->where('c.status', 'active')
            ->whereNotNull('c.end_date')
            ->where('c.end_date', '<=', now()->addDays(60))
            ->select([
                "c.{$key} as employee_id",
                'c.end_date',
                'e.employee_number',
                ...($hasNotice ? ['c.notice_period_days'] : []),
            ])
            ->get();

        foreach ($rows as $row) {
            $days = now()->startOfDay()->diffInDays(
                Carbon::parse($row->end_date), false
            );

            $notice = (int) ($row->notice_period_days ?? 60);

            $this->upsert([
                'type' => 'contract_expiry',
                'employee_id' => $row->employee_id,
                'severity' => $days <= $notice ? 'critical' : 'warning',
                'title' => $days < 0
                    ? 'عقد منتهي'
                    : "عقد ينتهي خلال {$days} يوم",
                'description' => sprintf(
                    'الموظف %s — مهلة الإشعار %d يوم.%s',
                    $row->employee_number,
                    $notice,
                    $days <= $notice ? ' دخلنا مهلة الإشعار — التجديد مطلوب الآن.' : ''
                ),
                'due_date' => $row->end_date,
                'days_remaining' => $days,
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * العقود غير الموثّقة في قوى.
     * من ١٥ أبريل ٢٠٢٦ الموظف السعودي لا يُحسب في نطاقات بدونها.
     */
    private function scanQiwa(): int
    {
        $count = 0;
        $key = HrFieldResolver::employeeKey('hr_employee_contracts');

        $rows = DB::table('hr_employee_contracts as c')
            ->join('hr_employees as e', 'e.id', '=', "c.{$key}")
            ->where('c.status', 'active')
            ->whereNull('c.qiwa_authenticated_at')
            ->whereIn('e.status', ['active', 'probation'])
            ->select("c.{$key} as employee_id", 'e.employee_number', 'e.nationality_type')
            ->get();

        foreach ($rows as $row) {
            $isSaudi = ($row->nationality_type ?? 'saudi') !== 'expat';

            $this->upsert([
                'type' => 'qiwa_not_authenticated',
                'employee_id' => $row->employee_id,
                'severity' => $isSaudi ? 'critical' : 'warning',
                'title' => 'عقد غير موثّق في قوى',
                'description' => sprintf(
                    'الموظف %s — %s',
                    $row->employee_number,
                    $isSaudi
                        ? 'موظف سعودي بعقد غير موثّق: لا يُحسب في نطاقات (سارٍ من ١٥ أبريل ٢٠٢٦).'
                        : 'توثيق العقد مطلوب نظامًا.'
                ),
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * تعارض الراتب بين المسيّر والعقد.
     * ده اللي بيرفض ملف مدد وبيجمّد خدمات مقيم.
     */
    private function scanSalaryMismatch(): int
    {
        $count = 0;

        $payrollKey = HrFieldResolver::employeeKey('hr_payrolls');
        $contractKey = HrFieldResolver::employeeKey('hr_employee_contracts');

        $rows = DB::table('hr_payrolls as p')
            ->join('hr_employees as e', 'e.id', '=', "p.{$payrollKey}")
            ->join('hr_employee_contracts as c', function ($join) use ($contractKey, $payrollKey) {
                $join->on("c.{$contractKey}", '=', "p.{$payrollKey}")
                    ->where('c.status', '=', 'active');
            })
            ->whereIn('p.status', ['draft', 'pending', 'approved'])
            ->selectRaw("
                p.{$payrollKey} as employee_id,
                e.employee_number,
                (p.basic_salary + p.housing_allowance + p.transport_allowance
                 + p.other_allowances) as payroll_wage,
                (c.basic_salary + c.housing_allowance + c.transport_allowance
                 + c.other_allowances) as contract_wage
            ")
            ->get()
            ->filter(fn ($r) => abs((float) $r->payroll_wage - (float) $r->contract_wage) >= 0.01);

        foreach ($rows as $row) {
            $this->upsert([
                'type' => 'salary_mismatch',
                'employee_id' => $row->employee_id,
                'severity' => 'critical',
                'title' => 'تعارض بين راتب المسيّر وراتب العقد',
                'description' => sprintf(
                    'الموظف %s — المسيّر %s والعقد %s. التعارض ده بيرفض ملف مدد وبيجمّد خدمات مقيم.',
                    $row->employee_number,
                    number_format((float) $row->payroll_wage, 2),
                    number_format((float) $row->contract_wage, 2)
                ),
            ]);

            $count++;
        }

        return $count;
    }

    private function scanProbation(): int
    {
        $count = 0;

        $rows = HrEmployee::query()
            ->where('status', 'probation')
            ->whereNotNull('probation_end_date')
            ->where('probation_end_date', '<=', now()->addDays(14))
            ->get();

        foreach ($rows as $employee) {
            $days = now()->startOfDay()->diffInDays(
                Carbon::parse($employee->probation_end_date), false
            );

            $this->upsert([
                'type' => 'probation_ending',
                'employee_id' => $employee->id,
                'severity' => 'warning',
                'title' => $days < 0
                    ? 'فترة تجربة منتهية بدون قرار'
                    : "فترة تجربة تنتهي خلال {$days} يوم",
                'description' => 'مطلوب قرار التثبيت أو إنهاء الخدمة قبل انتهاء المدة.',
                'due_date' => $employee->probation_end_date,
                'days_remaining' => $days,
            ]);

            $count++;
        }

        return $count;
    }

    private function scanGosi(): int
    {
        $count = 0;

        $rows = HrEmployee::query()
            ->whereIn('status', ['active', 'probation'])
            ->where('gosi_subscribed', true)
            ->whereNull('gosi_number')
            ->get();

        foreach ($rows as $employee) {
            $this->upsert([
                'type' => 'gosi_unregistered',
                'employee_id' => $employee->id,
                'severity' => 'critical',
                'title' => 'موظف بدون رقم تأمينات',
                'description' => sprintf(
                    'الموظف %s مشترك في التأمينات بدون رقم مسجّل — بيرفض ملف مدد.',
                    $employee->employee_number
                ),
            ]);

            $count++;
        }

        return $count;
    }

    /**
     * موعد ملف الأجور والغرامة المحتملة بالريال.
     * ٣٠٠٠ ريال لكل موظف شهريًا — على ٥٠ موظف = ١٥٠ ألف في شهر.
     */
    private function scanWpsDeadline(): int
    {
        $lastMonth = now()->subMonth();

        $run = Schema::hasTable('hr_payroll_runs')
            ? DB::table('hr_payroll_runs')
                ->where('period_year', $lastMonth->year)
                ->where('period_month', $lastMonth->month)
                ->first()
            : null;

        if ($run && $run->wps_submitted_at) {
            return 0;
        }

        $deadline = now()->startOfMonth()->addDays(self::WPS_DEADLINE_DAY - 1);
        $daysRemaining = now()->startOfDay()->diffInDays($deadline, false);

        $employeesCount = (int) ($run->employees_count ?? HrEmployee::query()
            ->whereIn('status', ['active', 'probation'])
            ->where('is_active', true)
            ->count());

        $penalty = $employeesCount * self::WPS_PENALTY_PER_EMPLOYEE;

        $this->upsert([
            'type' => 'wps_deadline',
            'employee_id' => null,
            'severity' => $daysRemaining <= 5 ? 'critical' : 'warning',
            'title' => $daysRemaining < 0
                ? 'ملف حماية الأجور متأخر'
                : "موعد رفع ملف حماية الأجور خلال {$daysRemaining} يوم",
            'description' => sprintf(
                'ملف أجور %02d/%d %s. الغرامة المحتملة: %s ريال (%d موظف × %s شهريًا).',
                $lastMonth->month,
                $lastMonth->year,
                $run ? 'محسوب وغير مرفوع' : 'لم يُنشأ بعد',
                number_format($penalty, 0),
                $employeesCount,
                number_format(self::WPS_PENALTY_PER_EMPLOYEE, 0)
            ),
            'due_date' => $deadline->toDateString(),
            'days_remaining' => $daysRemaining,
            'potential_penalty' => $penalty,
        ]);

        return 1;
    }

    private function countableSaudis(): int
    {
        if (!Schema::hasColumn('hr_employee_contracts', 'qiwa_authenticated_at')
            || !Schema::hasColumn('hr_employees', 'nationality_type')) {
            return 0;
        }

        $key = HrFieldResolver::employeeKey('hr_employee_contracts');

        return (int) DB::table('hr_employees as e')
            ->join('hr_employee_contracts as c', function ($join) use ($key) {
                $join->on("c.{$key}", '=', 'e.id')->where('c.status', '=', 'active');
            })
            ->whereIn('e.status', ['active', 'probation'])
            ->where('e.nationality_type', '!=', 'expat')
            ->whereNotNull('c.qiwa_authenticated_at')
            ->count();
    }

    private function wpsStatus(): array
    {
        $lastMonth = now()->subMonth();

        $run = Schema::hasTable('hr_payroll_runs')
            ? DB::table('hr_payroll_runs')
                ->where('period_year', $lastMonth->year)
                ->where('period_month', $lastMonth->month)
                ->first()
            : null;

        $deadline = now()->startOfMonth()->addDays(self::WPS_DEADLINE_DAY - 1);

        return [
            'period' => sprintf('%02d/%d', $lastMonth->month, $lastMonth->year),
            'run_exists' => (bool) $run,
            'run_status' => $run->status ?? null,
            'validation_status' => $run->wps_validation_status ?? null,
            'generated_at' => $run->wps_generated_at ?? null,
            'submitted_at' => $run->wps_submitted_at ?? null,
            'deadline' => $deadline->toDateString(),
            'days_remaining' => now()->startOfDay()->diffInDays($deadline, false),
            'is_overdue' => now()->gt($deadline) && !($run->wps_submitted_at ?? null),
        ];
    }

    /** تنبيه واحد مفتوح لكل (نوع + موظف). */
    private function upsert(array $data): void
    {
        HrComplianceAlert::updateOrCreate(
            [
                'type' => $data['type'],
                'employee_id' => $data['employee_id'] ?? null,
                'status' => 'open',
            ],
            $data
        );
    }
}
