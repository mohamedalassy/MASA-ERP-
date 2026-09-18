# التغييرات عن الحزمة الأولى

## ملفات تُحذف من `masa-package`

```
backend/database/migrations/2026_08_05_000001_create_hr_structure_tables.php
backend/database/migrations/2026_08_05_000002_create_hr_payroll_engine_tables.php
backend/database/migrations/2026_09_19_000001_align_hr_employees_with_existing_screens.php
backend/app/Services/GosiCalculator.php
backend/app/Services/EosbCalculator.php
backend/app/Services/PayrollEngine.php
backend/app/Services/ComplianceMonitorService.php
backend/app/Services/WpsFileService.php
backend/app/Services/GoodsReceiptService.php      ← استلام الريبو أفضل
```

## ملفات لم تتغير — استخدمها من الحزمة الأولى

```
backend/database/seeders/GosiRatesSeeder.php
backend/database/seeders/HrLeaveTypesSeeder.php
backend/app/Http/Controllers/Api/HrPayrollController.php     ← تعديل بسيط
backend/app/Http/Controllers/Api/HrComplianceController.php
backend/app/Http/Controllers/Api/HrLeaveController.php       ← تعديل بسيط
backend/routes/hr-routes.php
frontend/src/pages/hr/*.jsx                                   ← ٦ شاشات
frontend/src/styles/hr.css
```

---

## جدول التوفيق الكامل

### ما تبنّيته من تصميمك

| الحقل | الجدول | السبب |
|---|---|---|
| `crosses_midnight` | hr_shifts | الوردية الليلية — لم أكن أغطيها |
| `late_grace_minutes` + `early_leave_grace_minutes` | hr_shifts | سماحيتان منفصلتان |
| `overtime_allowed` + `overtime_after_minutes` | hr_shifts | تحكم في بدء الإضافي |
| `working_days` | hr_shifts | إثبات بدل نفي — أوضح |
| `latitude`/`longitude`/`attendance_radius` | hr_branches | بصمة بالموقع على مستوى الفرع |
| `timezone` | hr_branches | فروع بدول مختلفة |
| `source` + `calculated_at` | hr_attendance_daily | مصدر السجل ووقت الحساب |
| `early_leave_minutes` + `break_minutes` | hr_attendance_daily | تفصيل أدق |
| `getGrossSalaryAttribute()` | HrEmployeeContract | تجميع الأجر في مكان واحد |
| `hr_payrolls` مسطّح | — | أبسط في الاستعلام |

### ما أضفته — وسببه

| الحقل | الجدول | بدونه |
|---|---|---|
| `nationality_type` | hr_employees | GosiCalculator لا يميّز الوافد |
| `gosi_first_registration_date` | hr_employees | **النسبة غلط لكل سعودي** |
| `gosi_scheme` · `gosi_subscribed` · `gosi_number` | hr_employees | لا اشتراك ولا ملف مدد |
| `iqama_*` · `passport_expiry` · `visa_*` · `border_number` | hr_employees | ٢ من ٨ تنبيهات لا تعمل |
| `qiwa_contract_number` + `qiwa_authenticated_at` | hr_employee_contracts | **نسبة السعودة غير قابلة للحساب** |
| `notice_period_days` | hr_employee_contracts | تنبيه انتهاء العقد بلا مرجع |
| `gosi_employer` | hr_payrolls | **حصة الشركة غير محفوظة — فجوة محاسبية** |
| `gosi_base` + `gosi_scheme` | hr_payrolls | لا تدقيق على الاشتراك |
| `eosb_accrual` | hr_payrolls | الالتزام يظهر فجأة |
| `cost_center_id` | hr_payrolls · hr_departments | لا توزيع للمصروف |
| `project_allocations` | hr_payrolls | **الميزة على جسر تضيع** |
| `ramadan_*` | hr_shifts | تقليل ساعات رمضان مطلوب نظامًا |

---

## `HrFieldResolver` — حل التعارض الداخلي

```
hr_attendance_daily    → employee_id
hr_employee_contracts  → hr_employee_id
hr_payrolls            → hr_employee_id
```

الخدمات مكتوبة بـ`HrFieldResolver::employeeKey('table')` — بتكتشف
الاسم الصحيح مرة واحدة وتخزّنه. **فهي تعمل سواء نفّذت هجرة التوحيد
أو لا.**

لما توحّد الأسماء: احذف `HrFieldResolver.php` واستبدل النداءات
بـ`'employee_id'` مباشرة.

---

## حماية إضافية

كل الخدمات بتفحص `Schema::hasColumn` قبل ما تلمس أي عمود جديد.
يعني **لو شغّلت الخدمات قبل الهجرة، مش هتقع** — هتشتغل ناقصة بس.

مثال من `ComplianceMonitorService::scan()`:

```php
if (Schema::hasColumn('hr_employees', 'iqama_expiry')) {
    $generated['iqama_expiry'] = $this->scanIqamaExpiry();
}
```
