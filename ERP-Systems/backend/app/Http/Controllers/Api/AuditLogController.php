<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

/**
 * سجل التدقيق.
 *
 *   GET /settings/audit-logs
 *   GET /settings/audit-logs/{auditLog}
 *   GET /settings/audit-logs/summary
 */
class AuditLogController extends Controller
{
    private const ACTION_LABELS = [
        'create' => 'إنشاء', 'update' => 'تعديل', 'delete' => 'حذف',
        'approve' => 'اعتماد', 'reject' => 'رفض', 'post' => 'ترحيل',
        'cancel' => 'إلغاء', 'override' => 'تجاوز', 'waive' => 'إعفاء',
        'denied' => 'محاولة مرفوضة', 'login' => 'تسجيل دخول',
    ];

    public function index(Request $request)
    {
        $logs = AuditLog::query()
            ->with('user:id,name')
            ->when($request->filled('module'), fn ($q) => $q->where('module', $request->module))
            ->when($request->filled('action'), fn ($q) => $q->where('action', $request->action))
            ->when($request->filled('severity'), fn ($q) => $q->where('severity', $request->severity))
            ->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->filled('record_id'), fn ($q) => $q->where('record_id', $request->record_id))
            ->when($request->filled('from'), fn ($q) => $q->whereDate('created_at', '>=', $request->from))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('created_at', '<=', $request->to))
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = trim($request->search);

                $q->where(function ($inner) use ($search) {
                    $inner->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('id')
            ->paginate((int) $request->input('per_page', 50));

        return response()->json([
            'success' => true,
            'data' => $logs->through(fn ($log) => [
                'id' => $log->id,
                'user' => $log->user?->name ?? 'النظام',
                'action' => $log->action,
                'action_label' => self::ACTION_LABELS[$log->action] ?? $log->action,
                'module' => $log->module,
                'title' => $log->title,
                'description' => $log->description,
                'record_id' => $log->record_id,
                'severity' => $log->severity,
                'permission_key' => $log->permission_key,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
                'has_changes' => !empty($log->new_values),
            ]),
        ]);
    }

    /** التفاصيل مع مقارنة قبل/بعد حقلاً بحقل. */
    public function show(AuditLog $auditLog)
    {
        $auditLog->load('user:id,name,email');

        $old = $auditLog->old_values ?? [];
        $new = $auditLog->new_values ?? [];

        $diff = [];

        foreach (array_keys($new + $old) as $field) {
            $diff[] = [
                'field' => $field,
                'old' => $old[$field] ?? null,
                'new' => $new[$field] ?? null,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                ...$auditLog->toArray(),
                'action_label' => self::ACTION_LABELS[$auditLog->action] ?? $auditLog->action,
                'diff' => $diff,
            ],
        ]);
    }

    /** ملخص — لوحة نشاط النظام. */
    public function summary(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $since = now()->subDays($days);

        $logs = AuditLog::where('created_at', '>=', $since)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'period_days' => $days,
                'total' => $logs->count(),

                'critical' => $logs->where('severity', 'critical')->count(),
                'denied' => $logs->where('action', 'denied')->count(),

                'by_module' => $logs->groupBy('module')
                    ->map->count()
                    ->sortDesc(),

                'by_action' => $logs->groupBy('action')
                    ->map->count()
                    ->sortDesc(),

                'top_users' => $logs->whereNotNull('user_id')
                    ->groupBy('user_id')
                    ->map(fn ($g) => [
                        'user_id' => $g->first()->user_id,
                        'count' => $g->count(),
                        'critical' => $g->where('severity', 'critical')->count(),
                    ])
                    ->sortByDesc('count')
                    ->take(10)
                    ->values(),

                // محاولات الوصول المرفوضة — مؤشر أمني
                'denied_attempts' => $logs->where('action', 'denied')
                    ->groupBy('permission_key')
                    ->map(fn ($g) => [
                        'permission' => $g->first()->permission_key,
                        'count' => $g->count(),
                    ])
                    ->sortByDesc('count')
                    ->take(10)
                    ->values(),
            ],
        ]);
    }
}
