<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

/**
 * كاتب سجل التدقيق.
 *
 * ⚠ جدول `audit_logs` موجود وكامل في الريبو — **ومافيش حاجة
 * بتكتب فيه**. الخدمة دي هي الكاتب الناقص.
 *
 * الاستخدام:
 *     AuditLogger::log('finance', 'post', $entry, 'ترحيل قيد');
 *     AuditLogger::changed('projects', $project, $before);
 */
class AuditLogger
{
    /** الوحدات اللي تغييراتها حسّاسة دائمًا. */
    private const CRITICAL_ACTIONS = [
        'post', 'approve', 'delete', 'cancel',
        'override', 'waive', 'reopen',
    ];

    public static function log(
        string $module,
        string $action,
        Model|int|null $record = null,
        ?string $title = null,
        ?string $description = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $permissionKey = null
    ): AuditLog {
        $recordId = $record instanceof Model
            ? $record->getKey()
            : $record;

        $modelType = $record instanceof Model
            ? get_class($record)
            : null;

        return AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'module' => $module,
            'record_id' => $recordId,
            'model_type' => $modelType,
            'title' => $title,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'permission_key' => $permissionKey,
            'severity' => self::severity($action),
            'ip_address' => Request::ip(),
            'user_agent' => substr((string) Request::userAgent(), 0, 500),
        ]);
    }

    /**
     * تسجيل تغيير على موديل — بيحسب الفرق تلقائيًا.
     * بيسجّل الحقول المتغيّرة **فقط** — مش الموديل كله.
     */
    public static function changed(
        string $module,
        Model $model,
        array $before,
        ?string $title = null
    ): ?AuditLog {
        $after = $model->getAttributes();

        $changes = [];
        $originals = [];

        foreach ($after as $key => $value) {
            if (in_array($key, ['updated_at', 'created_at'], true)) {
                continue;
            }

            $old = $before[$key] ?? null;

            if ((string) $old !== (string) $value) {
                $originals[$key] = $old;
                $changes[$key] = $value;
            }
        }

        if (empty($changes)) {
            return null;
        }

        return self::log(
            module: $module,
            action: 'update',
            record: $model,
            title: $title ?? 'تعديل بيانات',
            oldValues: $originals,
            newValues: $changes
        );
    }

    /** تسجيل محاولة مرفوضة — مهم أمنيًا. */
    public static function denied(
        string $module,
        string $permissionKey,
        ?string $description = null
    ): AuditLog {
        return self::log(
            module: $module,
            action: 'denied',
            title: 'محاولة وصول مرفوضة',
            description: $description,
            permissionKey: $permissionKey
        );
    }

    private static function severity(string $action): string
    {
        if (in_array($action, self::CRITICAL_ACTIONS, true)) {
            return 'critical';
        }

        return $action === 'denied' ? 'warning' : 'info';
    }
}
