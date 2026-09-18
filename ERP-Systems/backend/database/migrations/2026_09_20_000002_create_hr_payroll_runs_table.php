<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
|--------------------------------------------------------------------------
| رأس تشغيل الرواتب
|--------------------------------------------------------------------------
|
| جدولك hr_payrolls مسطّح — صف لكل موظف لكل شهر. تصميم سليم، لكنه
| مافيهوش كيان تعتمده وترحّله **ككل**: الاعتماد بيبقى لكل موظف
| لوحده، وده تعب إداري مع ٤٢ موظف، وبيخلي القيد المحاسبي مبعثرًا.
|
| الجدول ده **رأس خفيف فوق جدولك** — جدولك يفضل هو البنود.
|
*/
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_payroll_runs', function (Blueprint $table) {
            $table->id();

            $table->string('run_number', 50)->unique();

            $table->unsignedSmallInteger('period_year');
            $table->unsignedTinyInteger('period_month');

            // تشغيل لفرع معيّن — فاضي = كل الفروع
            $table->unsignedBigInteger('branch_id')->nullable();

            // draft | calculated | approved | posted | paid
            $table->string('status', 20)->default('draft');

            $table->unsignedInteger('employees_count')->default(0);

            /* الإجماليات — محسوبة من البنود عند الحساب */
            $table->decimal('total_gross', 18, 2)->default(0);
            $table->decimal('total_deductions', 18, 2)->default(0);
            $table->decimal('total_gosi_employee', 18, 2)->default(0);
            $table->decimal('total_gosi_employer', 18, 2)->default(0);
            $table->decimal('total_net', 18, 2)->default(0);
            $table->decimal('total_eosb_accrual', 18, 2)->default(0);

            // القيد المحاسبي الناتج عن الترحيل
            $table->unsignedBigInteger('finance_journal_entry_id')->nullable();

            /* ملف حماية الأجور — مدد */
            $table->string('wps_file_path')->nullable();
            $table->timestamp('wps_generated_at')->nullable();
            $table->timestamp('wps_submitted_at')->nullable();

            // pending | passed | failed
            $table->string('wps_validation_status', 20)->nullable();
            $table->json('wps_validation_errors')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('posted_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            // تشغيل واحد لكل فترة وفرع
            $table->unique(
                ['period_year', 'period_month', 'branch_id'],
                'payroll_run_period_branch_unique'
            );

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_payroll_runs');
    }
};
