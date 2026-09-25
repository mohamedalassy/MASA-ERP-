<?php

namespace Database\Seeders;

use App\Models\FinanceAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class PayrollAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            ['5210', 'الرواتب والأجور', 'Salary Expense', 'expense', 'debit'],
            ['5230', 'حصة الشركة في التأمينات الاجتماعية', 'GOSI Employer Expense', 'expense', 'debit'],
            ['5240', 'مصروف مكافأة نهاية الخدمة', 'EOSB Expense', 'expense', 'debit'],
            ['2130', 'الرواتب المستحقة', 'Salary Payable', 'liability', 'credit'],
            ['2150', 'التأمينات الاجتماعية المستحقة', 'GOSI Payable', 'liability', 'credit'],
            ['2220', 'مخصص مكافأة نهاية الخدمة', 'EOSB Provision', 'liability', 'credit'],
        ];

        DB::transaction(function () use ($accounts): void {
            foreach ($accounts as [$code, $name, $nameEn, $type, $balance]) {
                $existing = FinanceAccount::where('code', $code)->first();

                if ($existing) {
                    if ($existing->type !== $type || $existing->name_en !== $nameEn) {
                        throw new RuntimeException(
                            "الحساب {$code} موجود بمعنى مختلف؛ راجعه قبل متابعة التهيئة."
                        );
                    }

                    continue;
                }

                FinanceAccount::create([
                    'code' => $code,
                    'name' => $name,
                    'name_en' => $nameEn,
                    'type' => $type,
                    'normal_balance' => $balance,
                    'level' => 1,
                    'parent_id' => null,
                    'is_postable' => true,
                    'is_active' => true,
                ]);
            }
        });
    }
}