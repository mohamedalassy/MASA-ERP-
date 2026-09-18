<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

/**
 * كتالوج الصلاحيات.
 *
 * التشغيل: php artisan db:seed --class=PermissionsSeeder
 *
 * الصلاحيات المعلَّمة `sensitive` **لا تُمنح لأي دور افتراضي** —
 * تُمنح فرديًا بقرار صريح، وكل استخدام لها يُسجَّل في التدقيق.
 */
class PermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [

            /* ===== المشاريع ===== */
            ['projects.view', 'المشاريع', 'عرض المشاريع'],
            ['projects.create', 'المشاريع', 'إنشاء مشروع'],
            ['projects.update', 'المشاريع', 'تعديل بيانات المشروع'],
            ['projects.delete', 'المشاريع', 'حذف مشروع', true],
            ['projects.approve', 'المشاريع', 'اعتماد المشروع'],
            ['projects.stage.advance', 'المشاريع', 'نقل المشروع للمرحلة التالية'],
            ['projects.stage.return', 'المشاريع', 'إرجاع المشروع لمرحلة سابقة'],
            ['projects.stage.override', 'المشاريع', 'تجاوز شروط بوابة المرحلة', true],
            ['projects.checkin', 'المشاريع', 'تسجيل حضور في الموقع'],
            ['projects.event.create', 'المشاريع', 'إضافة تعليق أو حدث'],

            /* ===== المبيعات ===== */
            ['sales.view', 'المبيعات', 'عرض المبيعات'],
            ['sales.opportunity.manage', 'المبيعات', 'إدارة الفرص'],
            ['sales.quotation.create', 'المبيعات', 'إنشاء عرض سعر'],
            ['sales.quotation.send', 'المبيعات', 'إرسال العرض للعميل'],
            ['sales.quotation.approve', 'المبيعات', 'اعتماد عرض السعر', false, true],
            ['sales.quotation.override_margin', 'المبيعات', 'تجاوز بوابة الهامش', true],
            ['sales.overbilling.override', 'المبيعات', 'تجاوز حد الفوترة على العرض', true],

            /* ===== التسعير ===== */
            ['pricing.view', 'التسعير', 'عرض التسعير'],
            ['pricing.rule.manage', 'التسعير', 'إدارة قواعد الربح', true],
            ['pricing.costing.manage', 'التسعير', 'إدارة حسابات التكلفة'],
            ['pricing.package.manage', 'التسعير', 'إدارة الباقات'],
            ['pricing.supplier_price.manage', 'التسعير', 'إدارة أسعار الموردين'],
            ['pricing.cost.view', 'التسعير', 'عرض التكلفة والهامش', true],

            /* ===== المشتريات ===== */
            ['purchasing.view', 'المشتريات', 'عرض المشتريات'],
            ['purchasing.order.create', 'المشتريات', 'إنشاء أمر شراء'],
            ['purchasing.order.approve', 'المشتريات', 'اعتماد أمر الشراء', false, true],
            ['purchasing.order.receive', 'المشتريات', 'استلام أمر الشراء'],
            ['purchasing.order.cancel', 'المشتريات', 'إلغاء أمر الشراء'],
            ['purchasing.supplier.manage', 'المشتريات', 'إدارة الموردين'],
            ['purchasing.invoice.match', 'المشتريات', 'المطابقة الثلاثية'],

            /* ===== المخزون ===== */
            ['inventory.view', 'المخزون', 'عرض المخزون'],
            ['inventory.issue', 'المخزون', 'صرف للمشروع'],
            ['inventory.return', 'المخزون', 'مرتجع للمخزن'],
            ['inventory.transfer', 'المخزون', 'نقل بين المخازن'],
            ['inventory.count', 'المخزون', 'الجرد الفعلي'],
            ['inventory.adjust', 'المخزون', 'تسوية رصيد المخزون', true],
            ['inventory.cost.view', 'المخزون', 'عرض تكلفة المخزون', true],

            /* ===== المالية ===== */
            ['finance.view', 'المالية', 'عرض المالية'],
            ['finance.account.manage', 'المالية', 'إدارة دليل الحسابات', true],
            ['finance.journal.create', 'المالية', 'إنشاء قيد'],
            ['finance.journal.approve', 'المالية', 'اعتماد قيد', false, true],
            ['finance.journal.post', 'المالية', 'ترحيل قيد', true, true],
            ['finance.journal.delete', 'المالية', 'حذف قيد', true],
            ['finance.invoice.create', 'المالية', 'إنشاء فاتورة ضريبية'],
            ['finance.invoice.issue', 'المالية', 'إصدار الفاتورة', false, true],
            ['finance.invoice.cancel', 'المالية', 'إلغاء فاتورة', true],
            ['finance.payment.create', 'المالية', 'تسجيل دفعة', false, true],
            ['finance.reconciliation.manage', 'المالية', 'التسوية البنكية'],
            ['finance.asset.manage', 'المالية', 'إدارة الأصول الثابتة'],
            ['finance.period.close', 'المالية', 'إقفال فترة محاسبية', true],
            ['finance.report.view', 'المالية', 'عرض التقارير المالية'],

            /* ===== الضرائب ===== */
            ['tax.view', 'الضرائب', 'عرض الضرائب'],
            ['tax.profile.manage', 'الضرائب', 'إدارة الملفات الضريبية', true],
            ['tax.zatca.submit', 'الضرائب', 'إرسال لزاتكا', true],

            /* ===== الموارد البشرية ===== */
            ['hr.view', 'الموارد البشرية', 'عرض الموارد البشرية'],
            ['hr.employee.manage', 'الموارد البشرية', 'إدارة الموظفين'],
            ['hr.contract.manage', 'الموارد البشرية', 'إدارة العقود', true],
            ['hr.salary.view', 'الموارد البشرية', 'عرض الرواتب', true],
            ['hr.attendance.manage', 'الموارد البشرية', 'إدارة الحضور'],
            ['hr.leave.approve', 'الموارد البشرية', 'اعتماد الإجازات'],
            ['hr.payroll.create', 'الموارد البشرية', 'تشغيل مسيّر الرواتب'],
            ['hr.payroll.approve', 'الموارد البشرية', 'اعتماد المسيّر', true, true],
            ['hr.payroll.post', 'الموارد البشرية', 'ترحيل قيد الرواتب', true],
            ['hr.compliance.view', 'الموارد البشرية', 'لوحة الامتثال'],
            ['hr.wps.generate', 'الموارد البشرية', 'توليد ملف حماية الأجور', true],

            /* ===== النظام ===== */
            ['settings.manage', 'النظام', 'إدارة الإعدادات', true],
            ['permissions.manage', 'النظام', 'إدارة الصلاحيات', true],
            ['audit.view', 'النظام', 'عرض سجل التدقيق', true],
            ['reports.view', 'النظام', 'عرض التقارير'],
            ['reports.export', 'النظام', 'تصدير البيانات', true],
        ];

        foreach ($permissions as $index => $row) {
            [$key, $module, $name] = $row;

            $isSensitive = $row[3] ?? false;
            $supportsLimit = $row[4] ?? false;

            Permission::updateOrCreate(
                ['key' => $key],
                [
                    'module' => $module,
                    'name' => $name,
                    'is_sensitive' => $isSensitive,
                    'supports_amount_limit' => $supportsLimit,
                    'sort_order' => $index,
                ]
            );
        }
    }
}
