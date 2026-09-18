# تعديلات شاشات HR الستة

الشاشات من الحزمة الأولى **تعمل كما هي** — ما عدا شاشة الرواتب.
السبب: الـAPI رجع نفس الشكل، لكن بنود المسيّر أسماؤها اتغيّرت.

## `HrPayroll.jsx` — ٤ تعديلات

### ١. حصة الموظف

```diff
- {money(line.gosi_employee)}
+ {money(line.gosi_deduction)}
```

عمودك اسمه `gosi_deduction`. وحصة الشركة في `gosi_employer` (عمود جديد).

### ٢. الخصومات — محسوبة مسبقًا الآن

```diff
- const deductions =
-   Number(line.absence_deduction || 0)
-   + Number(line.late_deduction || 0)
-   + Number(line.unpaid_leave_deduction || 0)
-   + Number(line.other_deductions || 0);
+ const deductions = Number(line.total_deductions || 0);
```

جدولك فيه `total_deductions` جاهز — أنضف من التجميع في الواجهة.

### ٣. البدلات

```diff
- {money(Number(line.housing_allowance) + Number(line.other_allowances))}
+ {money(
+     Number(line.housing_allowance)
+     + Number(line.transport_allowance)
+     + Number(line.other_allowances)
+ )}
```

عندك `transport_allowance` عمود مستقل.

### ٤. تسمية النظام — جاهزة من الـAPI

```diff
- {line.gosi_scheme === "expat" ? "وافد · أخطار مهنية"
-   : line.gosi_scheme === "existing" ? "سعودي · النظام القديم"
-     : "سعودي · النظام الجديد"}
+ {line.scheme_label}
```

الكنترولر بيرجّع `scheme_label` جاهزة.

---

## إضافة مقترحة — عمود تكلفة صاحب العمل

الكنترولر بيرجّع `employer_cost` على التشغيل = الإجمالي + حصة
الشركة + المخصص. ضيفه كمؤشر سادس:

```jsx
{
  label: "تكلفة صاحب العمل", tone: "red", icon: Wallet,
  value: money(run?.employer_cost),
  note: "الإجمالي + التأمينات + المخصص",
}
```

**ليه مهم:** الإدارة بتفتكر إن تكلفة الموظف = راتبه. الرقم ده بيوضح
إنها أعلى بـ١٥–٢٠٪.

---

## إضافة مقترحة — توزيع المشاريع

`project_allocations` بيرجع مفكوكًا من JSON لكل بند. اعرضه كصف
قابل للتوسيع تحت الموظف:

```jsx
{line.project_allocations?.map((a) => (
  <div key={a.project_id}>
    <span>مشروع {a.project_id}</span>
    <b>{a.hours} س</b>
    <b>{money(a.cost)}</b>
    <small>{a.share_percent}%</small>
  </div>
))}
```

**دي الميزة على جسر** — تكلفة العمالة موزّعة على المشاريع فعليًا.

---

## الخمس شاشات الباقية

`HrCompliance` · `HrLeaves` · `HrShifts` · `HrContracts` · `HrPerformance`

تعمل بدون تعديل — بتقرأ من الـAPI اللي شكله ما اتغيّرش.

**ما عدا `HrShifts`:** ضيف عمودين لأن ورديتك أغنى من تصميمي:

```diff
+ <span>يعدّي منتصف الليل <b>{shift.crosses_midnight ? "نعم" : "لا"}</b></span>
+ <span>الإضافي بعد <b>{count(shift.overtime_after_minutes)} د</b></span>
```

وسماحية التأخير عندك عمودان:

```diff
- سماحية التأخير <b>{count(shift.grace_minutes)} د</b>
+ سماحية التأخير <b>{count(shift.late_grace_minutes)} د</b>
+ سماحية الانصراف المبكر <b>{count(shift.early_leave_grace_minutes)} د</b>
```

وأيام العمل عندك `working_days` (إثبات) مش `weekend_days` (نفي):

```diff
- const weekend = shift.weekend_days.map((d) => DAYS[d]).join(" و");
+ const workDays = (shift.working_days || []).map((d) => DAYS[d]).join(" · ");
```
