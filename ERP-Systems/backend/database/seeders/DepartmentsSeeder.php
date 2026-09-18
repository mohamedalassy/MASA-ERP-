<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\DepartmentPermission;
use Illuminate\Database\Seeder;

/**
 * الأقسام وصلاحياتها الافتراضية.
 *
 * التشغيل: php artisan db:seed --class=DepartmentsSeeder
 *
 * ⚠ شغّل PermissionsSeeder أولًا.
 *
 * حدود المبالغ هنا **أمثلة** — عدّلها حسب سياستك.
 */
class DepartmentsSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'code' => 'MGMT',
                'name' => 'الإدارة العليا',
                'workflow_stage' => null,
                'permissions' => [
                    ['projects.approve', null],
                    ['projects.stage.override', null],
                    ['sales.quotation.approve', null],
                    ['sales.quotation.override_margin', null],
                    ['purchasing.order.approve', null],
                    ['finance.journal.post', null],
                    ['hr.payroll.approve', null],
                    ['finance.period.close', null],
                    ['audit.view', null],
                ],
            ],
            [
                'code' => 'CRM',
                'name' => 'إدارة العملاء والمبيعات',
                'workflow_stage' => 'crm',
                'permissions' => [
                    ['projects.create', null],
                    ['sales.opportunity.manage', null],
                    ['sales.quotation.create', null],
                    ['sales.quotation.send', null],
                    // مندوب المبيعات ميشوفش التكلفة
                    ['pricing.cost.view', null, false],
                ],
            ],
            [
                'code' => 'PRICING',
                'name' => 'التسعير',
                'workflow_stage' => 'pricing',
                'permissions' => [
                    ['pricing.costing.manage', null],
                    ['pricing.package.manage', null],
                    ['pricing.supplier_price.manage', null],
                    ['pricing.cost.view', null],
                    ['sales.quotation.create', null],
                ],
            ],
            [
                'code' => 'PURCHASING',
                'name' => 'المشتريات',
                'workflow_stage' => 'purchasing',
                'permissions' => [
                    ['purchasing.order.create', null],
                    // مدير المشتريات يعتمد حتى ٥٠ ألف
                    ['purchasing.order.approve', 50000],
                    ['purchasing.order.receive', null],
                    ['purchasing.supplier.manage', null],
                    ['purchasing.invoice.match', null],
                    ['inventory.issue', null],
                ],
            ],
            [
                'code' => 'WAREHOUSE',
                'name' => 'المخازن',
                'workflow_stage' => null,
                'permissions' => [
                    ['inventory.issue', null],
                    ['inventory.return', null],
                    ['inventory.transfer', null],
                    ['inventory.count', null],
                    ['purchasing.order.receive', null],
                ],
            ],
            [
                'code' => 'FINANCE',
                'name' => 'المالية والمحاسبة',
                'workflow_stage' => 'finance',
                'permissions' => [
                    ['finance.account.manage', null],
                    ['finance.journal.create', null],
                    ['finance.journal.approve', 100000],
                    ['finance.invoice.create', null],
                    ['finance.invoice.issue', null],
                    ['finance.payment.create', 100000],
                    ['finance.reconciliation.manage', null],
                    ['finance.asset.manage', null],
                    ['finance.report.view', null],
                    ['tax.profile.manage', null],
                    ['pricing.cost.view', null],
                ],
            ],
            [
                'code' => 'EXECUTION',
                'name' => 'التنفيذ',
                'workflow_stage' => 'execution',
                'permissions' => [
                    ['projects.checkin', null],
                    ['projects.event.create', null],
                    ['inventory.view', null],
                    ['projects.stage.advance', null],
                ],
            ],
            [
                'code' => 'HR',
                'name' => 'الموارد البشرية',
                'workflow_stage' => null,
                'permissions' => [
                    ['hr.employee.manage', null],
                    ['hr.contract.manage', null],
                    ['hr.salary.view', null],
                    ['hr.attendance.manage', null],
                    ['hr.leave.approve', null],
                    ['hr.payroll.create', null],
                    ['hr.compliance.view', null],
                    ['hr.wps.generate', null],
                ],
            ],
        ];

        foreach ($departments as $index => $row) {
            $department = Department::updateOrCreate(
                ['code' => $row['code']],
                [
                    'name' => $row['name'],
                    'workflow_stage' => $row['workflow_stage'],
                    'is_active' => true,
                ]
            );

            foreach ($row['permissions'] as $permission) {
                DepartmentPermission::updateOrCreate(
                    [
                        'department_id' => $department->id,
                        'permission_key' => $permission[0],
                    ],
                    [
                        'amount_limit' => $permission[1] ?? null,
                        // العنصر الثالث false = منع صريح
                        'granted' => $permission[2] ?? true,
                    ]
                );
            }
        }
    }
}
