<?php

namespace App\Services;

use Illuminate\Support\Facades\Schema;

/**
 * حل تعارض أسماء مفاتيح الموظف.
 *
 * ⚠ جداولك الحالية فيها تعارض داخلي:
 *     hr_attendance_daily    → employee_id
 *     hr_employee_contracts  → hr_employee_id
 *     hr_payrolls            → hr_employee_id
 *
 * الخدمة دي بتكتشف الاسم الصحيح لكل جدول مرة واحدة وتخزّنه، فكل
 * الخدمات التانية تشتغل **سواء نفّذت هجرة التوحيد أو لا**.
 *
 * لما توحّد الأسماء، امسح الملف ده واستبدل النداءات بـ'employee_id'.
 */
class HrFieldResolver
{
    private static array $cache = [];

    /** اسم عمود مفتاح الموظف في جدول معيّن. */
    public static function employeeKey(string $table): string
    {
        if (isset(self::$cache[$table])) {
            return self::$cache[$table];
        }

        $key = Schema::hasColumn($table, 'employee_id')
            ? 'employee_id'
            : 'hr_employee_id';

        return self::$cache[$table] = $key;
    }

    /** عمود التاريخ في جدول الحضور اليومي. */
    public static function attendanceDateColumn(): string
    {
        if (isset(self::$cache['__attendance_date'])) {
            return self::$cache['__attendance_date'];
        }

        $column = Schema::hasColumn('hr_attendance_daily', 'attendance_date')
            ? 'attendance_date'
            : 'work_date';

        return self::$cache['__attendance_date'] = $column;
    }

    /** عمود دقائق العمل المطلوبة في الوردية. */
    public static function shiftMinutesColumn(): string
    {
        if (isset(self::$cache['__shift_minutes'])) {
            return self::$cache['__shift_minutes'];
        }

        $column = Schema::hasColumn('hr_shifts', 'required_minutes')
            ? 'required_minutes'
            : 'work_minutes';

        return self::$cache['__shift_minutes'] = $column;
    }

    public static function flush(): void
    {
        self::$cache = [];
    }
}
