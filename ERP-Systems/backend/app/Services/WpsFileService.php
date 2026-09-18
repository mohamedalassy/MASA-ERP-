<?php

namespace App\Services;

use App\Models\HrPayrollRun;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/**
 * ملف حماية الأجور (مدد) مع فحص مسبق — معاد كتابته على جداولك.
 *
 * التكامل المباشر بالـAPI محتاج اعتماد رسمي واتفاقيات. توليد الملف
 * بالصيغة المطلوبة مع فحص مسبق يمنع الرفض = ٩٠٪ من القيمة بـ١٠٪
 * من التعقيد.
 *
 * تأخّر أو غياب الملف = ٣٠٠٠ ريال لكل موظف شهريًا، والمخالفة
 * بتأثّر على تقييم نطاقات كذلك.
 */
class WpsFileService
{
    /**
     * الفحص المسبق — يمنع الرفض قبل الرفع.
     *
     * @return array{is_valid:bool,errors:array,warnings:array,checked_count:int}
     */
    public function validate(HrPayrollRun $run): array
    {
        $errors = [];
        $warnings = [];

        $rows = $this->rowsFor($run);

        $hasGosiNumber = Schema::hasColumn('hr_employees', 'gosi_number');
        $hasQiwa = Schema::hasColumn('hr_employee_contracts', 'qiwa_authenticated_at');

        foreach ($rows as $row) {
            $name = $row->employee_number;

            /* الآيبان — أشيع سبب رفض */
            if (empty($row->iban)) {
                $errors[] = "[{$name}] لا يوجد رقم آيبان.";
            } elseif (!$this->isValidSaudiIban($row->iban)) {
                $errors[] = "[{$name}] رقم الآيبان غير صحيح (SA + 22 خانة).";
            }

            /* رقم الهوية أو الإقامة */
            $identity = $row->national_id ?: ($row->iqama_number ?? null);

            if (empty($identity)) {
                $errors[] = "[{$name}] لا يوجد رقم هوية أو إقامة.";
            } elseif (strlen(preg_replace('/\D/', '', $identity)) !== 10) {
                $errors[] = "[{$name}] رقم الهوية يجب أن يكون 10 أرقام.";
            }

            /* رقم التأمينات */
            if ($hasGosiNumber && ($row->gosi_subscribed ?? true) && empty($row->gosi_number)) {
                $warnings[] = "[{$name}] مشترك في التأمينات بدون رقم مسجّل.";
            }

            /* العقد */
            if (empty($row->contract_id)) {
                $errors[] = "[{$name}] لا يوجد عقد ساري.";
            } else {
                if ($hasQiwa && empty($row->qiwa_authenticated_at)) {
                    $warnings[] = "[{$name}] العقد غير موثّق في قوى — لا يُحسب في نطاقات.";
                }

                /*
                 * ⚠ أهم فحص: تطابق الراتب مع العقد.
                 * التعارض هو اللي بيرفض ملف مدد وبيجمّد خدمات مقيم.
                 */
                $contractWage = round(
                    (float) $row->c_basic + (float) $row->c_housing
                    + (float) $row->c_transport + (float) $row->c_other,
                    2
                );

                $payrollWage = round(
                    (float) $row->basic_salary + (float) $row->housing_allowance
                    + (float) $row->transport_allowance + (float) $row->other_allowances,
                    2
                );

                if (abs($contractWage - $payrollWage) >= 0.01) {
                    $errors[] = sprintf(
                        '[%s] الراتب في المسيّر (%s) لا يطابق العقد (%s).',
                        $name,
                        number_format($payrollWage, 2),
                        number_format($contractWage, 2)
                    );
                }
            }

            if ((float) $row->net_salary <= 0) {
                $warnings[] = "[{$name}] صافي الراتب صفر أو أقل.";
            }
        }

        return [
            'is_valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
            'checked_count' => $rows->count(),
        ];
    }

    /** توليد ملف CSV بصيغة حماية الأجور. */
    public function generate(HrPayrollRun $run): array
    {
        $validation = $this->validate($run);

        $run->update([
            'wps_validation_status' => $validation['is_valid'] ? 'passed' : 'failed',
            'wps_validation_errors' => $validation['errors'],
        ]);

        if (!$validation['is_valid']) {
            return ['generated' => false, 'validation' => $validation];
        }

        $rows = $this->rowsFor($run);

        $csv = [[
            'Employee ID', 'Employee Name', 'National ID / Iqama', 'IBAN',
            'Basic Salary', 'Housing Allowance', 'Other Allowances',
            'Deductions', 'Net Salary',
        ]];

        foreach ($rows as $row) {
            $others = round(
                (float) $row->transport_allowance + (float) $row->other_allowances,
                2
            );

            $csv[] = [
                $row->employee_number,
                trim($row->first_name . ' ' . $row->last_name),
                $row->national_id ?: ($row->iqama_number ?? ''),
                $row->iban,
                number_format((float) $row->basic_salary, 2, '.', ''),
                number_format((float) $row->housing_allowance, 2, '.', ''),
                number_format($others, 2, '.', ''),
                number_format((float) $row->total_deductions, 2, '.', ''),
                number_format((float) $row->net_salary, 2, '.', ''),
            ];
        }

        $content = '';

        foreach ($csv as $line) {
            $content .= implode(',', array_map(
                fn ($cell) => '"' . str_replace('"', '""', (string) $cell) . '"',
                $line
            )) . "\r\n";
        }

        $path = sprintf(
            'wps/%s-%d-%02d.csv',
            $run->run_number, $run->period_year, $run->period_month
        );

        // BOM عشان إكسل يقرأ العربي صح
        Storage::disk('local')->put($path, "\xEF\xBB\xBF" . $content);

        $run->update([
            'wps_file_path' => $path,
            'wps_generated_at' => now(),
        ]);

        return [
            'generated' => true,
            'path' => $path,
            'rows' => count($csv) - 1,
            'total_net' => round((float) $run->total_net, 2),
            'validation' => $validation,
        ];
    }

    /** استعلام واحد يجمع الراتب والموظف والعقد. */
    private function rowsFor(HrPayrollRun $run)
    {
        $payrollKey = HrFieldResolver::employeeKey('hr_payrolls');
        $contractKey = HrFieldResolver::employeeKey('hr_employee_contracts');

        $hasIqama = Schema::hasColumn('hr_employees', 'iqama_number');
        $hasGosi = Schema::hasColumn('hr_employees', 'gosi_number');
        $hasQiwa = Schema::hasColumn('hr_employee_contracts', 'qiwa_authenticated_at');

        $select = [
            'p.basic_salary', 'p.housing_allowance', 'p.transport_allowance',
            'p.other_allowances', 'p.total_deductions', 'p.net_salary',
            'e.employee_number', 'e.first_name', 'e.last_name',
            'e.national_id', 'e.iban',
            'c.id as contract_id',
            'c.basic_salary as c_basic',
            'c.housing_allowance as c_housing',
            'c.transport_allowance as c_transport',
            'c.other_allowances as c_other',
        ];

        if ($hasIqama) {
            $select[] = 'e.iqama_number';
        }

        if ($hasGosi) {
            $select[] = 'e.gosi_number';
            $select[] = 'e.gosi_subscribed';
        }

        if ($hasQiwa) {
            $select[] = 'c.qiwa_authenticated_at';
        }

        return DB::table('hr_payrolls as p')
            ->join('hr_employees as e', 'e.id', '=', "p.{$payrollKey}")
            ->leftJoin('hr_employee_contracts as c', function ($join) use ($contractKey, $payrollKey) {
                $join->on("c.{$contractKey}", '=', "p.{$payrollKey}")
                    ->where('c.status', '=', 'active');
            })
            ->where('p.payroll_run_id', $run->id)
            ->select($select)
            ->get();
    }

    /** آيبان سعودي: SA + 22 خانة = 24 إجمالًا. */
    private function isValidSaudiIban(string $iban): bool
    {
        return (bool) preg_match(
            '/^SA\d{22}$/',
            strtoupper(preg_replace('/\s+/', '', $iban))
        );
    }
}
