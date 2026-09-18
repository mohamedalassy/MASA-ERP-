<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $branchId = DB::table('branches')->insertGetId([
            'code' => 'HQ-DMM',
            'name' => 'الفرع الرئيسي - الدمام',
            'name_en' => 'Dammam Head Office',
            'city' => 'Dammam',
            'region' => 'Eastern Province',
            'is_head_office' => true,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $departments = [
            ['code' => 'CRM', 'name' => 'إدارة علاقات العملاء', 'name_en' => 'CRM'],
            ['code' => 'SALES', 'name' => 'المبيعات', 'name_en' => 'Sales'],
            ['code' => 'PRICING', 'name' => 'التسعير', 'name_en' => 'Pricing'],
            ['code' => 'PURCH', 'name' => 'المشتريات', 'name_en' => 'Purchasing'],
            ['code' => 'FIN', 'name' => 'المالية', 'name_en' => 'Finance'],
            ['code' => 'INV', 'name' => 'المخزون', 'name_en' => 'Inventory'],
            ['code' => 'PROJ', 'name' => 'المشاريع والتنفيذ', 'name_en' => 'Projects & Execution'],
            ['code' => 'HR', 'name' => 'الموارد البشرية', 'name_en' => 'HR'],
        ];

        foreach ($departments as $department) {
            DB::table('departments')->insert([
                'branch_id' => $branchId,
                'code' => $department['code'],
                'name' => $department['name'],
                'name_en' => $department['name_en'],
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        DB::table('users')
            ->whereNull('branch_id')
            ->update([
                'branch_id' => $branchId,
                'is_active' => true,
            ]);

        DB::table('projects')
            ->whereNull('branch_id')
            ->update(['branch_id' => $branchId]);
    }

    public function down(): void
    {
        // Keep seeded organizational data to avoid destructive rollback.
    }
};
