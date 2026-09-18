<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| توحيد مفتاح الموظف — اختيارية
|--------------------------------------------------------------------------
|
| ⚠ تعارض داخلي في جداولك الحالية:
|
|     hr_attendance_daily    → employee_id
|     hr_employee_contracts  → hr_employee_id
|     hr_payrolls            → hr_employee_id
|
| نفس العلاقة باسمين. أي كود بيوصل الحضور بالرواتب هيحتاج يفتكر
| الاسمين، وأي مطوّر جديد هيغلط فيها.
|
| الهجرة دي بتوحّدهم على employee_id — الأقصر والأشيع في Laravel.
|
| ⚠ لو نفّذتها، لازم تعدّل الموديلين:
|     HrEmployeeContract::employee()  → 'employee_id'
|     HrPayroll::employee()           → 'employee_id'
|     وكذلك $fillable في الاتنين.
|
| الخدمات في الحزمة دي مكتوبة بـ**دالة مساعدة** بتشتغل مع الاسمين،
| فهي آمنة سواء نفّذت الهجرة أو لا.
|
*/
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('hr_employee_contracts', 'hr_employee_id')
            && !Schema::hasColumn('hr_employee_contracts', 'employee_id')) {
            Schema::table('hr_employee_contracts', function (Blueprint $table) {
                $table->renameColumn('hr_employee_id', 'employee_id');
            });
        }

        if (Schema::hasColumn('hr_payrolls', 'hr_employee_id')
            && !Schema::hasColumn('hr_payrolls', 'employee_id')) {
            Schema::table('hr_payrolls', function (Blueprint $table) {
                $table->renameColumn('hr_employee_id', 'employee_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('hr_employee_contracts', 'employee_id')) {
            Schema::table('hr_employee_contracts', function (Blueprint $table) {
                $table->renameColumn('employee_id', 'hr_employee_id');
            });
        }

        if (Schema::hasColumn('hr_payrolls', 'employee_id')) {
            Schema::table('hr_payrolls', function (Blueprint $table) {
                $table->renameColumn('employee_id', 'hr_employee_id');
            });
        }
    }
};
