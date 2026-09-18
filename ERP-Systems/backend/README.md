# MASA ERP — حزمة HR الموفَّقة (v2)

> **هذه الحزمة تحل محل كل ملفات HR في `masa-package` القديمة.**
> احذف من القديمة: `2026_08_05_000001` · `2026_08_05_000002` ·
> `2026_09_19_000001` · الخدمات الخمسة · الكنترولرات الثلاثة ·
> الشاشات الستة · `GoodsReceiptService.php`

مبنية على قراءة جداولك الفعلية من `MASA-ERP@f389704`:
`HrEmployee` · `HrEmployeeContract` · `HrPayroll` · `HrAttendanceDaily` ·
`HrShift` · `HrDepartment` · `HrBranch`

---

## ⚠️ تعارض داخلي في جداولك — لازم يتحسم أولاً

نفس العلاقة مسمّاة باسمين مختلفين:

| الجدول | اسم المفتاح |
|---|---|
| `hr_attendance_daily` | `employee_id` |
| `hr_employee_contracts` | `hr_employee_id` |
| `hr_payrolls` | `hr_employee_id` |

**ده مش اختلاف معايا — ده تعارض في تصميمك.** أي كود بيوصل الحضور
بالرواتب هيحتاج يفتكر الاسمين، وأي مطوّر جديد هيغلط فيها.

### التوصية

وحّدهم على `employee_id` (الأقصر والأشيع في Laravel). الهجرة المرفقة
`...unify_hr_employee_foreign_keys` بتعمل كده — وهي **اختيارية**:
لو فضّلت تسيبهم، قول لي وأكتب الخدمات على الاسمين.

---

## حاجات في تصميمك **أفضل من تصميمي** — اتبنّيتها

| الحقل | الجدول | ليه أفضل |
|---|---|---|
| `crosses_midnight` | hr_shifts | الوردية الليلية بتعدّي منتصف الليل — **أنا مكنتش حاططها** |
| `late_grace_minutes` + `early_leave_grace_minutes` | hr_shifts | سماحيتان منفصلتان بدل واحدة |
| `overtime_allowed` + `overtime_after_minutes` | hr_shifts | التحكم في بدء احتساب الإضافي |
| `working_days` (array) | hr_shifts | أوضح من `weekend_days` — إثبات بدل نفي |
| `latitude` + `longitude` + `attendance_radius` | hr_branches | **بصمة بالموقع على مستوى الفرع** |
| `timezone` | hr_branches | ضروري للفروع في دول مختلفة |
| `source` + `calculated_at` | hr_attendance_daily | مصدر السجل ووقت إعادة الحساب |
| `getGrossSalaryAttribute()` | HrEmployeeContract | تجميع الأجر في مكان واحد |
| `early_leave_minutes` + `break_minutes` | hr_attendance_daily | تفصيل أدق |

---

## اختلافات أسماء — **الخدمات اتعدّلت لتتبعك**

| عندك | كودي القديم |
|---|---|
| `attendance_date` | `work_date` |
| `required_minutes` | `work_minutes` |
| `contract_type` | `type` |
| `other_allowances` | `phone_ + food_ + other_allowance` |
| `gosi_deduction` | `gosi_employee` |
| `cost_center_code` (نص) | `cost_center_id` (مفتاح) |

### ملاحظة على `cost_center_code`

عندك نص، وعندي مفتاح أجنبي لجدول `cost_centers`. النص أسهل في
الإدخال لكنه **مش مضمون** — غلطة حرف واحد تكسر تقرير المصروفات
بالقسم. الهجرة بتضيف `cost_center_id` **بجانب** النص، والخدمة
بتجرّب المفتاح أولًا ثم النص.

---

## ⚠️ فقدان مقصود؟ — توقيت رمضان

جدول `hr_shifts` عندك **مافيهوش حقول رمضان**:
`ramadan_start_time` · `ramadan_end_time` · `ramadan_required_minutes`

تقليل ساعات العمل في رمضان **مطلوب نظامًا للمسلمين**، وجسر بيميّز
نفسه بيه. الهجرة بتضيفهم — لو مش عايزهم قول لي.

---

## الملفات

### هجرات (٣)

| الملف | الغرض | إلزامي؟ |
|---|---|---|
| `2026_09_20_000001_add_missing_hr_fields.php` | ١٩ عمود ناقص على ٤ جداول | ✅ نعم |
| `2026_09_20_000002_create_hr_payroll_runs_table.php` | رأس تشغيل فوق `hr_payrolls` | ✅ نعم |
| `2026_09_20_000003_unify_hr_employee_foreign_keys.php` | توحيد `employee_id` | ⬜ اختيارية |

### خدمات (٥ معاد كتابتها)

`GosiCalculator` · `EosbCalculator` · `PayrollEngine` ·
`ComplianceMonitorService` · `WpsFileService`

### كنترولرات

| الملف | الحالة |
|---|---|
| `HrPayrollController.php` | ✅ معاد كتابته — في الحزمة دي |
| `HrComplianceController.php` | يعمل كما هو — من الحزمة الأولى |
| `HrLeaveController.php` | يعمل كما هو — من الحزمة الأولى |

### مسارات

`routes/hr-routes.php` — **يحل محل** نسخة الحزمة الأولى.

### شاشات

الستة من الحزمة الأولى تعمل كما هي — ما عدا `HrPayroll.jsx`
(٤ تعديلات) و`HrShifts.jsx` (٣ إضافات). التفاصيل في
`FRONTEND-PATCH.md` بصيغة diff جاهزة للنسخ.

---

## ترتيب التنفيذ

```bash
# ١. الهجرات
php artisan migrate

# ٢. نسب التأمينات — إلزامي قبل أول مسيّر
php artisan db:seed --class=GosiRatesSeeder

# ٣. أنواع الإجازات
php artisan db:seed --class=HrLeaveTypesSeeder
```

---

## ما بعد التنفيذ — الاختبار

بعد الهجرات والـseeders، جرّب بالترتيب:

```bash
# ١. موظف واحد بعقد ساري
POST /api/hr/payroll-runs  { "year": 2026, "month": 9 }

# ٢. راجع الأرقام
GET  /api/hr/payroll-runs/1

# ٣. الفحص المسبق لمدد — قبل الاعتماد
POST /api/hr/payroll-runs/1/wps/validate

# ٤. اعتماد ثم ترحيل
POST /api/hr/payroll-runs/1/approve
POST /api/hr/payroll-runs/1/post
```

### ما يجب أن تتحقق منه

| الفحص | المتوقع |
|---|---|
| `gosi_scheme` على كل بند | `existing` أو `new` أو `expat` — مش فاضي |
| `gosi_employer` | أكبر من `gosi_deduction` (حصة الشركة أعلى) |
| `gosi_base` | = الأساسي + السكن، وبحد أقصى ٤٥٬٠٠٠ |
| القيد المحاسبي | متوازن — المدين = الدائن |
| `project_allocations` | يظهر فقط لموظف له بصمات موقع مقفولة |

### لو الترحيل فشل

الرسالة هتقول أي حساب ناقص. الحسابات الخمسة المطلوبة:

`5210` الرواتب والأجور · `5230` التأمينات الاجتماعية ·
`2130` رواتب مستحقة · `2150` التأمينات المستحقة ·
`2220` مكافأة نهاية الخدمة

كلها في `ChartOfAccountsSeeder` من الحزمة الأولى.

---

## ⚠️ قبل التشغيل على بيانات حقيقية

**راجع نسب التأمينات** في `GosiRatesSeeder` على موقع المؤسسة
الرسمي. النسب فيه من مصادر منشورة بتواريخ ٢٠٢٦، وصفوف ٢٠٢٧
و٢٠٢٨ **تقديرية ومعلَّمة كذلك في `notes`**.

نسبة التقاعد في النظام الجديد ترتفع ٠.٥٪ على كل طرف كل يوليو
حتى ٢٠٢٨ — ولهذا الجدول موجود أصلاً: إضافة صف أرخص من تعديل كود.
