MASA AI Sales — Full Arabic/UI Review V3
=========================================

الهدف:
- تعريب النصوص الثابتة داخل ملفات JSX نفسها.
- الحفاظ على API paths والقيم الداخلية lowercase مثل new/qualified/open كما هي.
- RTL كامل.
- توحيد Search / Input / Select / Textarea.
- تكبير الخطوط الصغيرة.
- تحويل AI Score والتحليلات الزخرفية للبنفسجي.
- الأخضر يظل للحالات الدلالية الحقيقية فقط.
- إنشاء Backup تلقائي قبل أي تعديل.

طريقة التشغيل:
1) فك الضغط.
2) انسخ مجلد MASA_AI_Sales_Arabic_UI_Full_Review داخل C:\pro\MASA
3) افتح CMD:
   cd C:\pro\MASA
   node MASA_AI_Sales_Arabic_UI_Full_Review\apply-ai-sales-arabic.mjs

4) Build:
   cd C:\pro\MASA\ERP-Systems\frontend
   npm.cmd run build

Backup:
C:\pro\MASA\_ai_sales_backup_before_arabic_final

السكريبت يراجع/يعدل جميع ملفات JSX الموجودة داخل:
ERP-Systems/frontend/src/pages/ai-sales
بالإضافة إلى:
EnterpriseUI.jsx
AISalesNav.jsx
ai-sales-nav.css
shared.jsx
ai-sales-enterprise.css
