<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| منظومة الصلاحيات — إكمال الجداول الفاضية
|--------------------------------------------------------------------------
|
| ⚠ الوضع الحالي في الريبو:
|
|     departments             → id + timestamps فقط
|     department_permissions  → id + timestamps فقط
|     user_permissions        → id + timestamps فقط
|     audit_logs              → كامل (عبر repair migration) لكن بلا كاتب
|
| يعني خططت للمنظومة وعملت جداولها **ووقفت عند الخطوة الأولى**.
| والموديلات الثلاثة كلاسات فاضية بـ// جواها.
|
| الهجرة دي بتملأ الجداول الموجودة — مش بتنشئ جداول جديدة، فمفيش
| تعارض مع الهجرات القديمة.
|
| ====== نموذج الصلاحيات ======
|
| مفتاح نصي لكل صلاحية: "module.action"
|     finance.journal.post · purchasing.order.approve
|
| والحسم بالترتيب:
|     ١. صلاحية مستخدم صريحة (سماح أو منع) — الأقوى
|     ٢. صلاحية القسم
|     ٣. الدور الافتراضي
|     ٤. المنع
|
| المنع الصريح على مستوى المستخدم يغلب أي سماح — عشان تقدر
| تستثني شخصًا من صلاحية قسمه بدون ما تغيّر القسم.
|
*/
return new class extends Migration
{
    public function up(): void
    {
        /* ===================== الأقسام ===================== */
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'code')) {
                $table->string('code', 50)->unique()->after('id');
                $table->string('name');
                $table->string('name_en')->nullable();

                $table->unsignedBigInteger('parent_id')->nullable();

                // مدير القسم — لدورة الموافقات
                $table->unsignedBigInteger('manager_id')->nullable();

                /*
                 * ربط القسم بمرحلة سير العمل:
                 * crm · pricing · purchasing · finance · execution
                 * يسمح بتوجيه المشروع للقسم الصحيح آليًا.
                 */
                $table->string('workflow_stage', 30)->nullable();

                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->timestamp('deleted_at')->nullable();

                $table->index('parent_id');
                $table->index('workflow_stage');
            }
        });

        /* ================ صلاحيات الأقسام ================ */
        Schema::table('department_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('department_permissions', 'permission_key')) {
                $table->unsignedBigInteger('department_id')->after('id');

                // "module.action" — مثال: finance.journal.post
                $table->string('permission_key', 100);

                $table->boolean('granted')->default(true);

                /*
                 * حد المبلغ للصلاحيات المالية.
                 * فاضي = بلا حد. مثال: مدير المشتريات يعتمد حتى
                 * ٥٠ ألف، وفوقها يترفع للمدير العام.
                 */
                $table->decimal('amount_limit', 15, 2)->nullable();

                $table->unsignedBigInteger('created_by')->nullable();

                $table->unique(
                    ['department_id', 'permission_key'],
                    'dept_permission_unique'
                );

                $table->index('permission_key');
            }
        });

        /* ================ صلاحيات المستخدمين ================ */
        Schema::table('user_permissions', function (Blueprint $table) {
            if (!Schema::hasColumn('user_permissions', 'permission_key')) {
                $table->unsignedBigInteger('user_id')->after('id');

                $table->string('permission_key', 100);

                /*
                 * false = **منع صريح** يغلب صلاحية القسم.
                 * ده اللي يخليك تستثني شخصًا بدون تغيير قسمه.
                 */
                $table->boolean('granted')->default(true);

                $table->decimal('amount_limit', 15, 2)->nullable();

                // صلاحية مؤقتة — للتفويض أثناء الإجازات
                $table->date('valid_until')->nullable();

                $table->text('reason')->nullable();

                $table->unsignedBigInteger('created_by')->nullable();

                $table->unique(
                    ['user_id', 'permission_key'],
                    'user_permission_unique'
                );

                $table->index('permission_key');
                $table->index('valid_until');
            }
        });

        /* ================ حقول المستخدم ================ */
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                /*
                 * الدور الافتراضي — يعطي حزمة صلاحيات جاهزة:
                 * admin · general_manager · finance_manager · accountant
                 * sales · pricing · purchasing · warehouse
                 * hr_manager · site_engineer · viewer
                 */
                $table->string('role', 40)->default('viewer');
            }

            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }

            if (!Schema::hasColumn('users', 'phone')) {
                $table->string('phone', 30)->nullable();
            }

            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable();
                $table->string('last_login_ip', 45)->nullable();
            }
        });

        /* ================ كتالوج الصلاحيات ================ */
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();

                $table->string('key', 100)->unique();
                $table->string('module', 50);
                $table->string('name');
                $table->text('description')->nullable();

                // هل تقبل حد مبلغ
                $table->boolean('supports_amount_limit')->default(false);

                /*
                 * صلاحية حسّاسة — تتطلب تسجيلًا في سجل التدقيق
                 * دائمًا، ولا تُمنح لدور افتراضي.
                 */
                $table->boolean('is_sensitive')->default(false);

                $table->unsignedInteger('sort_order')->default(0);

                $table->timestamps();

                $table->index('module');
            });
        }

        /* ================ سجل التدقيق — تحسينات ================ */
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_logs', 'model_type')) {
                // اسم الكلاس الكامل — للربط المورفي
                $table->string('model_type', 100)->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'severity')) {
                // info | warning | critical — للصلاحيات الحسّاسة
                $table->string('severity', 20)->default('info');
            }

            if (!Schema::hasColumn('audit_logs', 'permission_key')) {
                // الصلاحية المستخدمة — لتدقيق من فعل ماذا بأي صلاحية
                $table->string('permission_key', 100)->nullable();
            }
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['module', 'created_at']);
            $table->index(['model_type', 'record_id']);
            $table->index('severity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['model_type', 'severity', 'permission_key']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'is_active', 'phone', 'last_login_at', 'last_login_ip',
            ]);
        });

        Schema::table('user_permissions', function (Blueprint $table) {
            $table->dropColumn([
                'user_id', 'permission_key', 'granted',
                'amount_limit', 'valid_until', 'reason', 'created_by',
            ]);
        });

        Schema::table('department_permissions', function (Blueprint $table) {
            $table->dropColumn([
                'department_id', 'permission_key', 'granted',
                'amount_limit', 'created_by',
            ]);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn([
                'code', 'name', 'name_en', 'parent_id', 'manager_id',
                'workflow_stage', 'is_active', 'description', 'deleted_at',
            ]);
        });
    }
};
