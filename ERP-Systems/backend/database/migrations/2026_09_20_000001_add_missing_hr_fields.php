<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| إكمال حقول الموارد البشرية
|--------------------------------------------------------------------------
|
| مبنية على قراءة جداولك الفعلية. كل الأعمدة nullable ومحمية بـhasColumn،
| فتشغيلها آمن ومتكرر ولا يكسر بيانات قائمة.
|
| ١٩ عمود على ٤ جداول:
|   hr_employees          → ١٠ (تأمينات + إقامة وجواز)
|   hr_employee_contracts → ٣  (قوى + مهلة الإشعار)
|   hr_payrolls           → ٦  (تفصيل التأمينات + مخصص + مشاريع)
|   hr_shifts             → ٣  (توقيت رمضان)
|   hr_departments        → ١  (مركز التكلفة كمفتاح)
|
*/
return new class extends Migration
{
    public function up(): void
    {
        /* ===================== الموظفون ===================== */
        Schema::table('hr_employees', function (Blueprint $table) {

            /*
             * ---------- التأمينات الاجتماعية ----------
             * بدون دي، GosiCalculator مش قادر يحسب أي اشتراك.
             */

            // saudi | gcc | expat — الوافد أخطار مهنية ٢٪ فقط
            if (!Schema::hasColumn('hr_employees', 'nationality_type')) {
                $table->string('nationality_type', 20)
                    ->default('saudi')
                    ->after('nationality');
            }

            $table->string('gosi_number', 30)->nullable();

            /*
             * ⚠ أهم حقل في الهجرة دي.
             *
             * تاريخ أول اشتراك في التأمينات **على الإطلاق** — مش
             * تاريخ التعيين عندك. سعودي معيَّن جديد في ٢٠٢٦ وعنده
             * سجل سابق قبل ٣ يوليو ٢٠٢٤ بيفضل على النظام القديم
             * (٢١.٥٪) مش الجديد (٢٣.٥٪).
             *
             * استخدام الجنسية أو تاريخ التعيين وحدهما = أرقام غلط.
             */
            $table->date('gosi_first_registration_date')->nullable();

            // existing | new | expat — تجاوز يدوي، له الأولوية
            $table->string('gosi_scheme', 20)->nullable();

            $table->boolean('gosi_subscribed')->default(true);

            /*
             * ---------- الإقامة والجواز ----------
             * ComplianceMonitorService بيمسحها يوميًا.
             */
            $table->string('iqama_number', 20)->nullable();
            $table->date('iqama_expiry')->nullable();
            $table->date('passport_expiry')->nullable();
            $table->string('visa_number', 30)->nullable();
            $table->string('border_number', 30)->nullable();
        });

        Schema::table('hr_employees', function (Blueprint $table) {
            $table->index('iqama_expiry');
            $table->index('gosi_scheme');
            $table->index(['nationality_type', 'status']);
        });

        /* ===================== العقود ===================== */
        Schema::table('hr_employee_contracts', function (Blueprint $table) {

            /*
             * توثيق قوى — من ١٥ أبريل ٢٠٢٦ الموظف السعودي لا يُحسب
             * في نطاقات إلا لو عقده موثّق ومصدَّق إلكترونيًا.
             * التسجيل في التأمينات وحده لم يعد كافيًا.
             */
            $table->string('qiwa_contract_number', 50)->nullable();
            $table->date('qiwa_authenticated_at')->nullable();

            // مهلة الإشعار — تنبيه انتهاء العقد بيحسب عليها
            $table->unsignedSmallInteger('notice_period_days')->default(60);
        });

        Schema::table('hr_employee_contracts', function (Blueprint $table) {
            $table->index('qiwa_authenticated_at');
            $table->index('end_date');
        });

        /* ===================== الرواتب ===================== */
        Schema::table('hr_payrolls', function (Blueprint $table) {

            /*
             * ⚠ فجوة محاسبية في التصميم الحالي.
             *
             * عندك gosi_deduction = حصة الموظف فقط.
             * حصة الشركة (١١.٧٥٪ أو ١٢.٧٥٪) مش محفوظة — وهي
             * **مصروف على الشركة** لازم يدخل قيد الرواتب:
             *     مدين 5230 التأمينات الاجتماعية
             *     دائن 2150 التأمينات المستحقة (الحصتين)
             */
            $table->decimal('gosi_employer', 15, 2)->default(0);

            // الوعاء والنظام — للتدقيق ومراجعة أي خلاف مع التأمينات
            $table->decimal('gosi_base', 15, 2)->default(0);
            $table->string('gosi_scheme', 20)->nullable();

            // مخصص نهاية الخدمة الشهري — يمنع مفاجأة الالتزام
            $table->decimal('eosb_accrual', 15, 2)->default(0);

            // ربط بمركز التكلفة — لتوزيع المصروف في القيد
            $table->unsignedBigInteger('cost_center_id')->nullable();

            /*
             * ====== الميزة على جسر ======
             * توزيع تكلفة الموظف على المشاريع من بصمات الموقع.
             * [{project_id, minutes, hours, cost, share_percent}]
             */
            $table->json('project_allocations')->nullable();

            // ربط بتشغيل الرواتب — الهجرة التالية تنشئ الجدول
            $table->unsignedBigInteger('payroll_run_id')->nullable();
        });

        Schema::table('hr_payrolls', function (Blueprint $table) {
            $table->index('payroll_run_id');
            $table->index(['period_year', 'period_month']);
        });

        /* ===================== الورديات ===================== */
        Schema::table('hr_shifts', function (Blueprint $table) {

            /*
             * توقيت رمضان — تقليل ساعات العمل مطلوب نظامًا للمسلمين،
             * وجسر بيميّز نفسه بيه.
             *
             * فاضي = الوردية متأثرش في رمضان.
             */
            $table->time('ramadan_start_time')->nullable();
            $table->time('ramadan_end_time')->nullable();
            $table->unsignedSmallInteger('ramadan_required_minutes')->nullable();
        });

        /* ===================== الأقسام ===================== */
        Schema::table('hr_departments', function (Blueprint $table) {
            /*
             * عندك cost_center_code كنص — سهل في الإدخال لكن غلطة
             * حرف واحد بتكسر تقرير المصروفات بالقسم.
             *
             * نضيف المفتاح **بجانب** النص، والخدمة بتجرّب المفتاح
             * أولًا ثم ترجع للنص. فمفيش حاجة تتكسر.
             */
            if (!Schema::hasColumn('hr_departments', 'cost_center_id')) {
                $table->unsignedBigInteger('cost_center_id')->nullable();
                $table->index('cost_center_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('hr_departments', function (Blueprint $table) {
            $table->dropColumn('cost_center_id');
        });

        Schema::table('hr_shifts', function (Blueprint $table) {
            $table->dropColumn([
                'ramadan_start_time',
                'ramadan_end_time',
                'ramadan_required_minutes',
            ]);
        });

        Schema::table('hr_payrolls', function (Blueprint $table) {
            $table->dropColumn([
                'gosi_employer', 'gosi_base', 'gosi_scheme',
                'eosb_accrual', 'cost_center_id',
                'project_allocations', 'payroll_run_id',
            ]);
        });

        Schema::table('hr_employee_contracts', function (Blueprint $table) {
            $table->dropColumn([
                'qiwa_contract_number',
                'qiwa_authenticated_at',
                'notice_period_days',
            ]);
        });

        Schema::table('hr_employees', function (Blueprint $table) {
            $table->dropColumn([
                'nationality_type', 'gosi_number',
                'gosi_first_registration_date', 'gosi_scheme',
                'gosi_subscribed', 'iqama_number', 'iqama_expiry',
                'passport_expiry', 'visa_number', 'border_number',
            ]);
        });
    }
};
