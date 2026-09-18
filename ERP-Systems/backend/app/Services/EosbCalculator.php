<?php

namespace App\Services;

use App\Models\HrEmployee;
use Carbon\Carbon;

/**
 * حاسبة مكافأة نهاية الخدمة — المادة ٨٤.
 *
 * نصف شهر لكل سنة في الخمس الأولى، وشهر كامل لكل سنة بعدها.
 *
 * الوعاء: **الأجر الأخير شاملًا كل البدلات الثابتة**.
 * ⚠ مختلف عن وعاء التأمينات (أساسي + سكن فقط).
 *
 * ====== تغيير عن النسخة السابقة ======
 * بيستخدم getGrossSalaryAttribute() من عقدك مباشرة — أنضف من
 * تجميع البدلات في كل خدمة على حدة.
 */
class EosbCalculator
{
    /**
     * @param  string  $reason  resignation|dismissal|contract_end|retirement|death
     */
    public function calculate(
        HrEmployee $employee,
        float $lastWage,
        string $reason = 'contract_end',
        ?string $endDate = null
    ): array {
        $start = Carbon::parse($employee->hire_date);

        $end = $endDate
            ? Carbon::parse($endDate)
            : ($employee->termination_date
                ? Carbon::parse($employee->termination_date)
                : now());

        $days = $start->diffInDays($end);
        $years = round($days / 365.25, 4);

        $dailyWage = round($lastWage / 30, 4);

        $firstFive = min($years, 5);
        $firstPortion = round($firstFive * 15 * $dailyWage, 2);

        $beyondFive = max(0, $years - 5);
        $secondPortion = round($beyondFive * 30 * $dailyWage, 2);

        $full = round($firstPortion + $secondPortion, 2);

        $ratio = $this->entitlementRatio($reason, $years);

        return [
            'years' => $years,
            'service_days' => $days,
            'wage' => round($lastWage, 2),
            'daily_wage' => $dailyWage,
            'reason' => $reason,
            'full_entitlement' => $full,
            'entitlement_ratio' => $ratio,
            'payable' => round($full * $ratio, 2),
            'breakdown' => [
                'first_five_years' => [
                    'years' => round($firstFive, 4),
                    'days_per_year' => 15,
                    'amount' => $firstPortion,
                ],
                'beyond_five_years' => [
                    'years' => round($beyondFive, 4),
                    'days_per_year' => 30,
                    'amount' => $secondPortion,
                ],
            ],
            'note' => $this->explainRatio($reason, $ratio),
        ];
    }

    /** المخصص الشهري — يُرحَّل مع الرواتب بدل مفاجأة الالتزام. */
    public function monthlyAccrual(
        HrEmployee $employee,
        float $lastWage,
        ?string $asOfDate = null
    ): float {
        $start = Carbon::parse($employee->hire_date);
        $asOf = $asOfDate ? Carbon::parse($asOfDate) : now();

        $years = $start->diffInDays($asOf) / 365.25;

        $daysPerYear = $years >= 5 ? 30 : 15;

        return round((($daysPerYear * ($lastWage / 30)) / 12), 2);
    }

    /**
     * نسبة الاستحقاق — المادة ٨٥ للاستقالة.
     * أقل من سنتين لا شيء · ٢–٥ الثلث · ٥–١٠ الثلثين · +١٠ كامل.
     */
    private function entitlementRatio(string $reason, float $years): float
    {
        if ($reason !== 'resignation') {
            return 1.0;
        }

        if ($years < 2) {
            return 0.0;
        }

        if ($years < 5) {
            return 1 / 3;
        }

        if ($years < 10) {
            return 2 / 3;
        }

        return 1.0;
    }

    private function explainRatio(string $reason, float $ratio): string
    {
        if ($reason !== 'resignation') {
            return 'استحقاق كامل — انتهاء الخدمة بغير استقالة.';
        }

        return match (true) {
            $ratio === 0.0 => 'لا يستحق — استقالة قبل إتمام سنتين.',
            $ratio < 0.4 => 'يستحق الثلث — استقالة بين سنتين وخمس سنوات.',
            $ratio < 0.7 => 'يستحق الثلثين — استقالة بين خمس وعشر سنوات.',
            default => 'استحقاق كامل — استقالة بعد عشر سنوات.',
        };
    }
}
