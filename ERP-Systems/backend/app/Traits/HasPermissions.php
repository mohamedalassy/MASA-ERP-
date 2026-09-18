<?php

namespace App\Traits;

use App\Models\Department;
use Illuminate\Support\Facades\DB;

/**
 * صلاحيات المستخدم — تُضاف على موديل User.
 *
 * ====== ترتيب الحسم ======
 *   ١. صلاحية مستخدم صريحة (سماح أو **منع**) — الأقوى
 *   ٢. صلاحية القسم
 *   ٣. الدور الافتراضي
 *   ٤. المنع
 *
 * المنع الصريح على مستوى المستخدم يغلب أي سماح — عشان تقدر تستثني
 * شخصًا من صلاحية قسمه بدون ما تنقله لقسم تاني.
 *
 * الاستخدام:
 *     $user->can('finance.journal.post')
 *     $user->canWithAmount('purchasing.order.approve', 75000)
 *     $user->permissionLimit('finance.payment.create')
 */
trait HasPermissions
{
    private ?array $resolvedPermissions = null;

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /** هل يملك الصلاحية. */
    public function hasPermission(string $key): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $resolved = $this->resolvePermissions();

        return ($resolved[$key]['granted'] ?? false) === true;
    }

    /**
     * صلاحية بمبلغ — للاعتمادات المالية.
     * الحد الفاضي = بلا حد.
     */
    public function canWithAmount(string $key, float $amount): bool
    {
        if (!$this->hasPermission($key)) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        $limit = $this->permissionLimit($key);

        return $limit === null || $amount <= $limit;
    }

    /** حد المبلغ المسموح — null = بلا حد. */
    public function permissionLimit(string $key): ?float
    {
        if ($this->isSuperAdmin()) {
            return null;
        }

        $resolved = $this->resolvePermissions();

        $limit = $resolved[$key]['amount_limit'] ?? null;

        return $limit === null ? null : (float) $limit;
    }

    /** كل الصلاحيات الفعّالة — للواجهة. */
    public function effectivePermissions(): array
    {
        if ($this->isSuperAdmin()) {
            return ['*' => ['granted' => true, 'amount_limit' => null]];
        }

        return array_filter(
            $this->resolvePermissions(),
            fn ($p) => $p['granted'] === true
        );
    }

    public function isSuperAdmin(): bool
    {
        return ($this->role ?? null) === 'admin';
    }

    /** إعادة الحساب — بعد أي تغيير في الصلاحيات. */
    public function flushPermissions(): void
    {
        $this->resolvedPermissions = null;
    }

    /* ==================== الحسم ==================== */

    private function resolvePermissions(): array
    {
        if ($this->resolvedPermissions !== null) {
            return $this->resolvedPermissions;
        }

        $resolved = [];

        // ٣. الدور الافتراضي — الأضعف
        foreach ($this->roleDefaults() as $key) {
            $resolved[$key] = ['granted' => true, 'amount_limit' => null];
        }

        // ٢. صلاحيات القسم
        if ($this->department_id) {
            $deptRows = DB::table('department_permissions')
                ->where('department_id', $this->department_id)
                ->get();

            foreach ($deptRows as $row) {
                $resolved[$row->permission_key] = [
                    'granted' => (bool) $row->granted,
                    'amount_limit' => $row->amount_limit,
                ];
            }
        }

        /*
         * ١. صلاحيات المستخدم — الأقوى.
         * بتتجاهل المنتهية الصلاحية (التفويض المؤقت).
         */
        $userRows = DB::table('user_permissions')
            ->where('user_id', $this->id)
            ->where(function ($q) {
                $q->whereNull('valid_until')
                    ->orWhere('valid_until', '>=', now()->toDateString());
            })
            ->get();

        foreach ($userRows as $row) {
            $resolved[$row->permission_key] = [
                'granted' => (bool) $row->granted,
                'amount_limit' => $row->amount_limit,
            ];
        }

        return $this->resolvedPermissions = $resolved;
    }

    /**
     * حزم الصلاحيات الافتراضية لكل دور.
     *
     * ⚠ الصلاحيات الحسّاسة (الترحيل · التجاوز · حذف المستندات)
     * **مش في أي حزمة** — تُمنح فرديًا بقرار صريح.
     */
    private function roleDefaults(): array
    {
        return match ($this->role ?? 'viewer') {

            'general_manager' => [
                'projects.view', 'projects.approve', 'projects.stage.advance',
                'projects.stage.override',
                'sales.view', 'sales.quotation.approve',
                'pricing.view', 'pricing.rule.manage',
                'purchasing.view', 'purchasing.order.approve',
                'inventory.view',
                'finance.view', 'finance.report.view',
                'hr.view', 'hr.payroll.approve',
                'reports.view',
            ],

            'finance_manager' => [
                'projects.view',
                'finance.view', 'finance.account.manage',
                'finance.journal.create', 'finance.journal.approve',
                'finance.journal.post',
                'finance.invoice.create', 'finance.invoice.issue',
                'finance.payment.create',
                'finance.reconciliation.manage',
                'finance.asset.manage',
                'finance.report.view',
                'tax.view', 'tax.profile.manage',
                'reports.view',
            ],

            'accountant' => [
                'projects.view',
                'finance.view',
                'finance.journal.create',
                'finance.invoice.create',
                'finance.payment.create',
                'finance.report.view',
                'tax.view',
            ],

            'sales' => [
                'projects.view', 'projects.create',
                'sales.view', 'sales.opportunity.manage',
                'sales.quotation.create', 'sales.quotation.send',
                'pricing.view',
                'inventory.view',
            ],

            'pricing' => [
                'projects.view',
                'pricing.view', 'pricing.costing.manage',
                'pricing.package.manage',
                'pricing.supplier_price.manage',
                'sales.quotation.create',
                'inventory.view',
            ],

            'purchasing' => [
                'projects.view',
                'purchasing.view', 'purchasing.order.create',
                'purchasing.order.receive',
                'purchasing.supplier.manage',
                'inventory.view', 'inventory.issue',
                'pricing.supplier_price.manage',
            ],

            'warehouse' => [
                'inventory.view', 'inventory.issue',
                'inventory.count',
                'purchasing.order.receive',
                'projects.view',
            ],

            'hr_manager' => [
                'hr.view', 'hr.employee.manage', 'hr.contract.manage',
                'hr.attendance.manage', 'hr.leave.approve',
                'hr.payroll.create',
                'hr.compliance.view',
                'reports.view',
            ],

            'site_engineer' => [
                'projects.view',
                'projects.checkin',
                'projects.event.create',
                'inventory.view',
            ],

            default => ['projects.view', 'reports.view'],
        };
    }
}
