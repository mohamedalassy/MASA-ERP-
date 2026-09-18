<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentPermission;
use App\Models\Permission;
use App\Models\User;
use App\Models\UserPermission;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * إدارة الصلاحيات.
 *
 *   GET    /settings/permissions              كتالوج الصلاحيات
 *   GET    /settings/departments              الأقسام وصلاحياتها
 *   PUT    /settings/departments/{department}/permissions
 *   GET    /settings/users/{user}/permissions
 *   PUT    /settings/users/{user}/permissions
 *   GET    /me/permissions                    صلاحياتي — للواجهة
 */
class PermissionController extends Controller
{
    /** الكتالوج مجمّعًا بالوحدة. */
    public function catalog()
    {
        $permissions = Permission::orderBy('sort_order')->get();

        return response()->json([
            'success' => true,
            'data' => $permissions
                ->groupBy('module')
                ->map(fn ($group, $module) => [
                    'module' => $module,
                    'count' => $group->count(),
                    'sensitive_count' => $group->where('is_sensitive', true)->count(),
                    'permissions' => $group->values(),
                ])
                ->values(),
        ]);
    }

    public function departments()
    {
        $departments = Department::query()
            ->with(['permissions', 'manager:id,name'])
            ->withCount('users')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $departments->map(fn ($d) => [
                ...$d->toArray(),
                'granted_count' => $d->permissions->where('granted', true)->count(),
                'denied_count' => $d->permissions->where('granted', false)->count(),
            ]),
        ]);
    }

    public function updateDepartmentPermissions(
        Request $request,
        Department $department
    ) {
        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*.key' => ['required', 'string', 'exists:permissions,key'],
            'permissions.*.granted' => ['required', 'boolean'],
            'permissions.*.amount_limit' => ['nullable', 'numeric', 'min:0'],
        ]);

        $before = DepartmentPermission::where('department_id', $department->id)
            ->pluck('granted', 'permission_key')
            ->toArray();

        DB::transaction(function () use ($validated, $department, $request) {
            DepartmentPermission::where('department_id', $department->id)->delete();

            foreach ($validated['permissions'] as $permission) {
                DepartmentPermission::create([
                    'department_id' => $department->id,
                    'permission_key' => $permission['key'],
                    'granted' => $permission['granted'],
                    'amount_limit' => $permission['amount_limit'] ?? null,
                    'created_by' => $request->user()?->id,
                ]);
            }
        });

        $after = collect($validated['permissions'])
            ->pluck('granted', 'key')
            ->toArray();

        AuditLogger::log(
            module: 'settings',
            action: 'update',
            record: $department,
            title: 'تعديل صلاحيات قسم ' . $department->name,
            oldValues: $before,
            newValues: $after,
            permissionKey: 'permissions.manage'
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث صلاحيات القسم.',
            'data' => $department->fresh('permissions'),
        ]);
    }

    /** صلاحيات مستخدم — مع توضيح مصدر كل صلاحية. */
    public function userPermissions(User $user)
    {
        $user->load('department:id,code,name');

        $overrides = UserPermission::where('user_id', $user->id)->get();

        $departmentPermissions = $user->department_id
            ? DepartmentPermission::where('department_id', $user->department_id)->get()
            : collect();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'is_active' => $user->is_active,
                    'department' => $user->department,
                ],

                // الصلاحيات الفعّالة بعد الحسم
                'effective' => $user->effectivePermissions(),

                // من أين جاءت — للشرح في الواجهة
                'from_department' => $departmentPermissions,
                'overrides' => $overrides,

                'is_super_admin' => $user->isSuperAdmin(),
            ],
        ]);
    }

    public function updateUserPermissions(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['nullable', 'string', 'max:40'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
            'is_active' => ['nullable', 'boolean'],

            'overrides' => ['nullable', 'array'],
            'overrides.*.key' => ['required', 'string', 'exists:permissions,key'],
            'overrides.*.granted' => ['required', 'boolean'],
            'overrides.*.amount_limit' => ['nullable', 'numeric', 'min:0'],
            'overrides.*.valid_until' => ['nullable', 'date', 'after:today'],
            'overrides.*.reason' => ['nullable', 'string', 'max:500'],
        ]);

        $before = [
            'role' => $user->role,
            'department_id' => $user->department_id,
            'is_active' => $user->is_active,
        ];

        DB::transaction(function () use ($validated, $user, $request) {
            $user->update(array_filter([
                'role' => $validated['role'] ?? null,
                'department_id' => $validated['department_id'] ?? null,
                'is_active' => $validated['is_active'] ?? null,
            ], fn ($v) => $v !== null));

            if (array_key_exists('overrides', $validated)) {
                UserPermission::where('user_id', $user->id)->delete();

                foreach ($validated['overrides'] ?? [] as $override) {
                    UserPermission::create([
                        'user_id' => $user->id,
                        'permission_key' => $override['key'],
                        'granted' => $override['granted'],
                        'amount_limit' => $override['amount_limit'] ?? null,
                        'valid_until' => $override['valid_until'] ?? null,
                        'reason' => $override['reason'] ?? null,
                        'created_by' => $request->user()?->id,
                    ]);
                }
            }
        });

        $user->flushPermissions();

        AuditLogger::log(
            module: 'settings',
            action: 'update',
            record: $user,
            title: 'تعديل صلاحيات المستخدم ' . $user->name,
            oldValues: $before,
            newValues: [
                'role' => $user->role,
                'department_id' => $user->department_id,
                'is_active' => $user->is_active,
                'overrides_count' => count($validated['overrides'] ?? []),
            ],
            permissionKey: 'permissions.manage'
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث صلاحيات المستخدم.',
            'data' => ['effective' => $user->fresh()->effectivePermissions()],
        ]);
    }

    /** صلاحياتي — الواجهة بتخفي بيها الأزرار. */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false], 401);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'department' => $user->department,
                'is_super_admin' => $user->isSuperAdmin(),
                'permissions' => array_keys($user->effectivePermissions()),
                'limits' => collect($user->effectivePermissions())
                    ->filter(fn ($p) => $p['amount_limit'] !== null)
                    ->map(fn ($p) => (float) $p['amount_limit']),
            ],
        ]);
    }
}
