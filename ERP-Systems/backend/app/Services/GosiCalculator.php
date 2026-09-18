<?php

namespace App\Services;

use App\Models\GosiRateSchedule;
use App\Models\HrEmployee;
use Carbon\Carbon;

/**
 * حاسبة التأمينات الاجتماعية — معاد كتابتها على جداولك.
 *
 * النسب بتُقرأ من gosi_rate_schedules بتاريخ سريان — مش مكتوبة في
 * الكود، لأن نسبة التقاعد في النظام الجديد بترتفع ٠.٥٪ على كل طرف
 * كل يوليو حتى ٢٠٢٨.
 *
 * الوعاء: الأساسي + بدل السكن فقط، بحد أقصى ٤٥٬٠٠٠ ريال.
 * ⚠ وعاء مختلف تمامًا عن وعاء نهاية الخدمة — راجع EosbCalculator.
 *
 * ====== تغييرات عن النسخة السابقة ======
 * - بيقرأ housing_allowance من العقد النشط مش من الموظف
 * - بيستخدم nationality_type وgosi_first_registration_date الجديدين
 */
class GosiCalculator
{
    /**
     * @return array{scheme:string,base:float,employee:float,employer:float,total:float,breakdown:array}
     */
    public function calculate(
        HrEmployee $employee,
        float $basicSalary,
        float $housingAllowance,
        ?string $asOfDate = null
    ): array {
        $date = $asOfDate ? Carbon::parse($asOfDate) : now();

        $scheme = $this->resolveScheme($employee);

        if (!($employee->gosi_subscribed ?? true)) {
            return $this->zero($scheme);
        }

        $rates = $this->ratesFor($scheme, $date);

        if (!$rates) {
            return $this->zero($scheme);
        }

        $ceiling = (float) $rates->wage_ceiling;

        // الوعاء = أساسي + سكن، مقصوصًا عند الحد الأقصى
        $base = min(
            round($basicSalary + $housingAllowance, 2),
            $ceiling
        );

        $pensionEmployee = $this->pct($base, $rates->pension_employee);
        $pensionEmployer = $this->pct($base, $rates->pension_employer);
        $hazards = $this->pct($base, $rates->hazards_employer);
        $sanedEmployee = $this->pct($base, $rates->saned_employee);
        $sanedEmployer = $this->pct($base, $rates->saned_employer);

        $employeeTotal = round($pensionEmployee + $sanedEmployee, 2);
        $employerTotal = round($pensionEmployer + $hazards + $sanedEmployer, 2);

        return [
            'scheme' => $scheme,
            'base' => $base,
            'ceiling' => $ceiling,
            'is_capped' => $basicSalary + $housingAllowance > $ceiling,
            'employee' => $employeeTotal,
            'employer' => $employerTotal,
            'total' => round($employeeTotal + $employerTotal, 2),
            'breakdown' => [
                'pension' => [
                    'employee' => $pensionEmployee,
                    'employer' => $pensionEmployer,
                    'rate_employee' => (float) $rates->pension_employee,
                    'rate_employer' => (float) $rates->pension_employer,
                ],
                'hazards' => [
                    'employer' => $hazards,
                    'rate_employer' => (float) $rates->hazards_employer,
                ],
                'saned' => [
                    'employee' => $sanedEmployee,
                    'employer' => $sanedEmployer,
                    'rate_employee' => (float) $rates->saned_employee,
                    'rate_employer' => (float) $rates->saned_employer,
                ],
            ],
        ];
    }

    /**
     * تحديد النظام المطبَّق.
     *
     * ⚠ الفخ اللي بيسقّط أنظمة الرواتب: الجنسية وحدها مش كافية.
     * سعودي مُعيَّن جديد في ٢٠٢٦ بيفضل على النظام القديم لو عنده
     * سجل اشتراكات سابق قبل ٣ يوليو ٢٠٢٤. المُحدِّد هو تاريخ أول
     * اشتراك على الإطلاق — مش تاريخ التعيين عندك.
     */
    public function resolveScheme(HrEmployee $employee): string
    {
        // القيمة المحفوظة صراحة لها الأولوية دائمًا
        if (!empty($employee->gosi_scheme)) {
            return $employee->gosi_scheme;
        }

        if (($employee->nationality_type ?? 'saudi') === 'expat') {
            return 'expat';
        }

        $firstRegistration = $employee->gosi_first_registration_date
            ?? $employee->hire_date;

        if (!$firstRegistration) {
            return 'new';
        }

        return Carbon::parse($firstRegistration)
            ->lt(Carbon::parse('2024-07-03'))
                ? 'existing'
                : 'new';
    }

    private function ratesFor(string $scheme, Carbon $date): ?GosiRateSchedule
    {
        return GosiRateSchedule::query()
            ->where('scheme', $scheme)
            ->where('effective_from', '<=', $date->toDateString())
            ->where(function ($q) use ($date) {
                $q->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', $date->toDateString());
            })
            ->orderByDesc('effective_from')
            ->first();
    }

    private function pct(float $base, $rate): float
    {
        return round($base * ((float) $rate / 100), 2);
    }

    private function zero(string $scheme): array
    {
        return [
            'scheme' => $scheme,
            'base' => 0.0,
            'ceiling' => 45000.0,
            'is_capped' => false,
            'employee' => 0.0,
            'employer' => 0.0,
            'total' => 0.0,
            'breakdown' => [],
        ];
    }
}
