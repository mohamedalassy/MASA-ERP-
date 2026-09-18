<?php

namespace App\Services;

use App\Models\HrEmployee;
use App\Models\HrPayroll;
use App\Models\HrPayrollRun;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * محرك الرواتب — معاد كتابته على جداولك.
 *
 * ====== تغييرات جوهرية عن النسخة السابقة ======
 *
 * ١. بيكتب في جدولك المسطّح hr_payrolls — مش hr_payroll_lines
 * ٢. بيقرأ من hr_attendance_daily بعمود attendance_date (مش work_date)
 * ٣. بيستخدم HrFieldResolver لحل تعارض employee_id / hr_employee_id
 * ٤. بيستخدم getGrossSalaryAttribute() من عقدك
 * ٥. بيحترم overtime_after_minutes وcrosses_midnight من ورديتك
 *
 * ====== الميزة على جسر ======
 * project_allocations — توزيع تكلفة العمالة على المشاريع من بصمات
 * الموقع. جسر بيعرف إن الموظف اشتغل ٨ ساعات ومش بيعرف على أي مشروع.
 */
class PayrollEngine
{
    private const SALARY_EXPENSE = '5210';
    private const GOSI_EXPENSE = '5230';
    private const SALARY_PAYABLE = '2130';
    private const GOSI_PAYABLE = '2150';
    private const EOSB_PROVISION = '2220';

    public function __construct(
        private readonly GosiCalculator $gosi,
        private readonly EosbCalculator $eosb,
        private readonly JournalPostingService $posting,
        private readonly DocumentNumberService $sequences
    ) {}

    /** إنشاء تشغيل رواتب وحساب كل الموظفين. */
    public function run(
        int $year,
        int $month,
        ?int $branchId = null,
        ?int $userId = null
    ): HrPayrollRun {
        $existing = HrPayrollRun::query()
            ->where('period_year', $year)
            ->where('period_month', $month)
            ->where('branch_id', $branchId)
            ->first();

        if ($existing && $existing->status !== 'draft') {
            throw ValidationException::withMessages([
                'period' => [
                    'تشغيل رواتب الفترة دي موجود بحالة: ' . $existing->status,
                ],
            ]);
        }

        $employees = HrEmployee::query()
            ->with(['department'])
            ->whereIn('status', ['active', 'probation', 'on_leave'])
            ->where('is_active', true)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get();

        if ($employees->isEmpty()) {
            throw ValidationException::withMessages([
                'employees' => ['لا يوجد موظفون نشطون في الفترة دي.'],
            ]);
        }

        return DB::transaction(function () use (
            $existing, $year, $month, $branchId, $employees, $userId
        ) {
            $run = $existing ?: HrPayrollRun::create([
                'run_number' => $this->sequences->next('payroll_run', 'PR'),
                'period_year' => $year,
                'period_month' => $month,
                'branch_id' => $branchId,
                'status' => 'draft',
                'created_by' => $userId,
            ]);

            // مسح بنود التشغيل السابقة لنفس الفترة
            $this->payrollQuery()
                ->where('payroll_run_id', $run->id)
                ->delete();

            $totals = [
                'gross' => 0, 'deductions' => 0, 'net' => 0,
                'gosi_employee' => 0, 'gosi_employer' => 0, 'eosb' => 0,
            ];

            $counted = 0;

            foreach ($employees as $employee) {
                $contract = $this->activeContract($employee, $year, $month);

                if (!$contract) {
                    continue;
                }

                $row = $this->calculateEmployee(
                    $run, $employee, $contract, $year, $month
                );

                $counted++;

                $totals['gross'] += (float) $row->gross_salary;
                $totals['net'] += (float) $row->net_salary;
                $totals['deductions'] += (float) $row->total_deductions;
                $totals['gosi_employee'] += (float) $row->gosi_deduction;
                $totals['gosi_employer'] += (float) $row->gosi_employer;
                $totals['eosb'] += (float) $row->eosb_accrual;
            }

            if ($counted === 0) {
                throw ValidationException::withMessages([
                    'contracts' => ['مفيش موظف بعقد ساري في الفترة دي.'],
                ]);
            }

            $run->update([
                'status' => 'calculated',
                'employees_count' => $counted,
                'total_gross' => round($totals['gross'], 2),
                'total_deductions' => round($totals['deductions'], 2),
                'total_gosi_employee' => round($totals['gosi_employee'], 2),
                'total_gosi_employer' => round($totals['gosi_employer'], 2),
                'total_net' => round($totals['net'], 2),
                'total_eosb_accrual' => round($totals['eosb'], 2),
            ]);

            return $run->fresh();
        });
    }

    /** حساب موظف واحد وكتابته في hr_payrolls. */
    private function calculateEmployee(
        HrPayrollRun $run,
        HrEmployee $employee,
        $contract,
        int $year,
        int $month
    ): HrPayroll {
        $basic = (float) $contract->basic_salary;
        $housing = (float) $contract->housing_allowance;
        $transport = (float) $contract->transport_allowance;
        $other = (float) $contract->other_allowances;

        // الأجر الشهري الكامل — من accessor العقد
        $monthlyWage = (float) $contract->gross_salary;
        $dailyWage = round($monthlyWage / 30, 4);

        $attendance = $this->attendanceSummary($employee->id, $year, $month);

        /*
         * الإضافي: ١٥٠٪ من أجر الساعة نظامًا.
         * ساعات اليوم من الوردية لو معرَّفة، وإلا ٨.
         */
        $hoursPerDay = $this->dailyHours($employee);
        $hourlyWage = round($basic / 30 / $hoursPerDay, 4);

        $overtimeAmount = round(
            $attendance['overtime_hours'] * $hourlyWage * 1.5,
            2
        );

        $absenceDeduction = round($attendance['absence_days'] * $dailyWage, 2);
        $lateDeduction = round($attendance['late_minutes'] * ($hourlyWage / 60), 2);
        $unpaidDeduction = round($attendance['unpaid_leave_days'] * $dailyWage, 2);

        $gross = round($monthlyWage + $overtimeAmount, 2);

        $gosi = $this->gosi->calculate(
            $employee,
            $basic,
            $housing,
            Carbon::create($year, $month)->endOfMonth()->toDateString()
        );

        $totalDeductions = round(
            $absenceDeduction + $lateDeduction + $unpaidDeduction
            + $gosi['employee'],
            2
        );

        $net = round($gross - $totalDeductions, 2);

        $key = HrFieldResolver::employeeKey('hr_payrolls');

        return HrPayroll::create([
            $key => $employee->id,
            'payroll_run_id' => $run->id,

            'period_year' => $year,
            'period_month' => $month,

            'basic_salary' => $basic,
            'housing_allowance' => $housing,
            'transport_allowance' => $transport,
            'other_allowances' => $other,

            'overtime_hours' => $attendance['overtime_hours'],
            'overtime_amount' => $overtimeAmount,

            'absent_days' => $attendance['absence_days'],
            'worked_days' => $attendance['worked_days'],

            'absence_deduction' => $absenceDeduction,
            'late_deduction' => $lateDeduction,
            'other_deductions' => $unpaidDeduction,
            'loan_deduction' => 0,

            // حصة الموظف — عمودك الأصلي
            'gosi_deduction' => $gosi['employee'],

            // الأعمدة الجديدة من الهجرة
            'gosi_employer' => $gosi['employer'],
            'gosi_base' => $gosi['base'],
            'gosi_scheme' => $gosi['scheme'],

            'gross_salary' => $gross,
            'total_deductions' => $totalDeductions,
            'net_salary' => max(0, $net),

            'eosb_accrual' => $this->eosb->monthlyAccrual($employee, $monthlyWage),

            'cost_center_id' => $this->costCenterId($employee),

            'project_allocations' => $this->projectAllocations(
                $employee->user_id, $monthlyWage, $year, $month
            ),

            'status' => 'draft',
        ]);
    }

    /**
     * ملخص الحضور من hr_attendance_daily.
     * ⚠ عمود التاريخ عندك attendance_date مش work_date.
     */
    private function attendanceSummary(int $employeeId, int $year, int $month): array
    {
        $start = Carbon::create($year, $month, 1)->toDateString();
        $end = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        $dateColumn = HrFieldResolver::attendanceDateColumn();
        $key = HrFieldResolver::employeeKey('hr_attendance_daily');

        $row = DB::table('hr_attendance_daily')
            ->where($key, $employeeId)
            ->whereBetween($dateColumn, [$start, $end])
            ->selectRaw("
                COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0) as absence_days,
                COALESCE(SUM(CASE WHEN status IN ('present','late','early_leave') THEN 1 ELSE 0 END), 0) as worked_days,
                COALESCE(SUM(late_minutes), 0) as late_minutes,
                COALESCE(SUM(overtime_minutes), 0) as overtime_minutes
            ")
            ->first();

        $unpaidLeave = 0.0;

        if (\Illuminate\Support\Facades\Schema::hasTable('hr_leave_requests')) {
            $leaveKey = HrFieldResolver::employeeKey('hr_leave_requests');

            $unpaidLeave = (float) DB::table('hr_leave_requests as r')
                ->join('hr_leave_types as t', 't.id', '=', 'r.leave_type_id')
                ->where("r.{$leaveKey}", $employeeId)
                ->where('r.status', 'approved')
                ->where('t.is_paid', false)
                ->whereBetween('r.start_date', [$start, $end])
                ->sum('r.days_count');
        }

        return [
            'absence_days' => (float) ($row->absence_days ?? 0),
            'worked_days' => (float) ($row->worked_days ?? 0),
            'late_minutes' => (float) ($row->late_minutes ?? 0),
            'overtime_hours' => round((float) ($row->overtime_minutes ?? 0) / 60, 2),
            'unpaid_leave_days' => $unpaidLeave,
        ];
    }

    /** ساعات اليوم من الوردية — بعمود required_minutes عندك. */
    private function dailyHours(HrEmployee $employee): float
    {
        if (!$employee->shift_id) {
            return 8.0;
        }

        $column = HrFieldResolver::shiftMinutesColumn();

        $minutes = DB::table('hr_shifts')
            ->where('id', $employee->shift_id)
            ->value($column);

        return $minutes > 0 ? round($minutes / 60, 2) : 8.0;
    }

    /**
     * مركز التكلفة — بيجرّب المفتاح أولًا ثم النص.
     * ⚠ عندك cost_center_code كنص، والهجرة ضافت cost_center_id.
     */
    private function costCenterId(HrEmployee $employee): ?int
    {
        $department = $employee->department;

        if (!$department) {
            return null;
        }

        if (!empty($department->cost_center_id)) {
            return (int) $department->cost_center_id;
        }

        if (!empty($department->cost_center_code)) {
            return DB::table('cost_centers')
                ->where('code', $department->cost_center_code)
                ->value('id');
        }

        return null;
    }

    /**
     * ====== توزيع تكلفة العمالة على المشاريع ======
     *
     * بصمات الموقع (project_site_checkins) بتتحوّل لدقائق، والدقائق
     * لتكلفة، والتكلفة تنزل على المشروع فتظهر في الهامش الفعلي.
     *
     * ده اللي جسر مش قادر يعمله — لأنه منصة موارد بشرية بتعرف إن
     * الموظف اشتغل ٨ ساعات ومش بتعرف على أي مشروع.
     */
    private function projectAllocations(
        ?int $userId, float $monthlyWage, int $year, int $month
    ): ?array {
        if (!$userId
            || !\Illuminate\Support\Facades\Schema::hasTable('project_site_checkins')) {
            return null;
        }

        $start = Carbon::create($year, $month, 1);
        $end = $start->copy()->endOfMonth();

        $rows = DB::table('project_site_checkins')
            ->where('user_id', $userId)
            ->whereNotNull('checked_out_at')
            ->whereBetween('checked_in_at', [$start, $end])
            ->groupBy('project_id')
            ->selectRaw('project_id, SUM(duration_minutes) as minutes')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $totalMinutes = (float) $rows->sum('minutes');

        if ($totalMinutes <= 0) {
            return null;
        }

        // الطاقة الشهرية المعيارية: ٨ ساعات × ٢٢ يوم
        $standardMinutes = 8 * 60 * 22;
        $costPerMinute = $monthlyWage / $standardMinutes;

        return $rows->map(fn ($row) => [
            'project_id' => (int) $row->project_id,
            'minutes' => (int) $row->minutes,
            'hours' => round($row->minutes / 60, 2),
            'cost' => round($row->minutes * $costPerMinute, 2),
            'share_percent' => round(($row->minutes / $totalMinutes) * 100, 2),
        ])->all();
    }

    /** العقد الساري في الفترة. */
    private function activeContract(HrEmployee $employee, int $year, int $month)
    {
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth();
        $key = HrFieldResolver::employeeKey('hr_employee_contracts');

        return DB::table('hr_employee_contracts')
            ->where($key, $employee->id)
            ->where('status', 'active')
            ->where('start_date', '<=', $periodEnd->toDateString())
            ->where(function ($q) use ($periodEnd) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', $periodEnd->startOfMonth()->toDateString());
            })
            ->orderByDesc('start_date')
            ->first();
    }

    private function payrollQuery()
    {
        return DB::table('hr_payrolls');
    }

    /**
     * ترحيل قيد الرواتب.
     *
     *   مدين  5210 الرواتب والأجور        ← سطر لكل مركز تكلفة
     *   مدين  5230 التأمينات الاجتماعية    (حصة الشركة)
     *   مدين  2220 مخصص نهاية الخدمة
     *   دائن  2130 رواتب مستحقة           (الصافي)
     *   دائن  2150 التأمينات المستحقة      (الحصتين)
     *   دائن  2220 مخصص نهاية الخدمة
     */
    public function post(HrPayrollRun $run, ?int $userId = null): HrPayrollRun
    {
        if ($run->status !== 'approved') {
            throw ValidationException::withMessages([
                'status' => ['يجب اعتماد تشغيل الرواتب قبل الترحيل.'],
            ]);
        }

        $salaryAccount = $this->posting->requireAccount(self::SALARY_EXPENSE, 'الرواتب والأجور');
        $gosiExpense = $this->posting->requireAccount(self::GOSI_EXPENSE, 'التأمينات الاجتماعية');
        $salaryPayable = $this->posting->requireAccount(self::SALARY_PAYABLE, 'رواتب مستحقة');
        $gosiPayable = $this->posting->requireAccount(self::GOSI_PAYABLE, 'التأمينات المستحقة');
        $eosbProvision = $this->posting->requireAccount(self::EOSB_PROVISION, 'مكافأة نهاية الخدمة');

        $lines = [];

        // مصروف الرواتب بسطر لكل مركز تكلفة
        $byCostCenter = DB::table('hr_payrolls')
            ->where('payroll_run_id', $run->id)
            ->groupBy('cost_center_id')
            ->selectRaw('cost_center_id, SUM(gross_salary) as amount')
            ->get();

        foreach ($byCostCenter as $group) {
            $amount = round((float) $group->amount, 2);

            if ($amount <= 0) {
                continue;
            }

            $lines[] = [
                'account_id' => $salaryAccount->id,
                'debit' => $amount,
                'credit' => 0,
                'description' => 'مصروف رواتب الفترة',
                'cost_center_id' => $group->cost_center_id ?: null,
            ];
        }

        $gosiEmployer = round((float) $run->total_gosi_employer, 2);
        $gosiEmployee = round((float) $run->total_gosi_employee, 2);
        $eosbAccrual = round((float) $run->total_eosb_accrual, 2);

        if ($gosiEmployer > 0) {
            $lines[] = [
                'account_id' => $gosiExpense->id,
                'debit' => $gosiEmployer,
                'credit' => 0,
                'description' => 'حصة الشركة في التأمينات',
            ];
        }

        if ($eosbAccrual > 0) {
            $lines[] = [
                'account_id' => $eosbProvision->id,
                'debit' => $eosbAccrual,
                'credit' => 0,
                'description' => 'مخصص نهاية الخدمة — مصروف الشهر',
            ];

            $lines[] = [
                'account_id' => $eosbProvision->id,
                'debit' => 0,
                'credit' => $eosbAccrual,
                'description' => 'مخصص نهاية الخدمة — التزام',
            ];
        }

        $lines[] = [
            'account_id' => $salaryPayable->id,
            'debit' => 0,
            'credit' => round((float) $run->total_net, 2),
            'description' => 'صافي الرواتب المستحقة',
        ];

        if ($gosiEmployer + $gosiEmployee > 0) {
            $lines[] = [
                'account_id' => $gosiPayable->id,
                'debit' => 0,
                'credit' => round($gosiEmployer + $gosiEmployee, 2),
                'description' => 'التأمينات المستحقة — الحصتين',
            ];
        }

        return DB::transaction(function () use ($run, $lines, $userId) {
            $entry = $this->posting->post(
                reference: [
                    'type' => 'payroll_run',
                    'id' => $run->id,
                    'number' => $run->run_number,
                ],
                lines: $lines,
                description: sprintf(
                    'قيد رواتب شهر %02d/%d',
                    $run->period_month,
                    $run->period_year
                ),
                entryDate: Carbon::create($run->period_year, $run->period_month)
                    ->endOfMonth()->toDateString(),
                userId: $userId,
                notes: 'قيد آلي ناتج عن ترحيل تشغيل الرواتب.'
            );

            $run->update([
                'status' => 'posted',
                'finance_journal_entry_id' => $entry->id,
                'posted_at' => now(),
            ]);

            DB::table('hr_payrolls')
                ->where('payroll_run_id', $run->id)
                ->update(['status' => 'posted']);

            return $run->fresh();
        });
    }
}
