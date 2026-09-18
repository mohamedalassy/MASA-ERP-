<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('hr_salary_structures', function(Blueprint $t){
   $t->id(); $t->string('code',40)->unique(); $t->string('name');
   $t->enum('pay_frequency',['monthly','weekly','daily'])->default('monthly');
   $t->boolean('is_active')->default(true); $t->json('settings')->nullable(); $t->timestamps();
  });
  Schema::create('hr_salary_components', function(Blueprint $t){
   $t->id(); $t->string('code',50)->unique(); $t->string('name');
   $t->enum('type',['earning','deduction','employer_contribution'])->default('earning');
   $t->enum('calculation_type',['fixed','percentage','formula','attendance'])->default('fixed');
   $t->decimal('default_value',14,2)->default(0); $t->string('formula')->nullable();
   $t->boolean('taxable')->default(false); $t->boolean('gosi_applicable')->default(false);
   $t->boolean('is_active')->default(true); $t->json('settings')->nullable(); $t->timestamps();
  });
  Schema::create('hr_salary_structure_components', function(Blueprint $t){
   $t->id(); $t->foreignId('salary_structure_id')->constrained('hr_salary_structures')->cascadeOnDelete();
   $t->foreignId('salary_component_id')->constrained('hr_salary_components')->cascadeOnDelete();
   $t->decimal('value',14,2)->nullable(); $t->unsignedInteger('sort_order')->default(0);
   $t->timestamps(); $t->unique(['salary_structure_id','salary_component_id']);
  });
  Schema::create('hr_employee_compensations', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->foreignId('salary_structure_id')->nullable()->constrained('hr_salary_structures')->nullOnDelete();
   $t->decimal('basic_salary',14,2)->default(0); $t->string('currency',3)->default('SAR');
   $t->date('effective_from'); $t->date('effective_to')->nullable(); $t->json('component_overrides')->nullable();
   $t->boolean('is_active')->default(true); $t->timestamps(); $t->index(['employee_id','effective_from']);
  });
  Schema::create('hr_payroll_runs_v2', function(Blueprint $t){
   $t->id(); $t->string('run_number',50)->unique(); $t->string('name');
   $t->date('period_start'); $t->date('period_end'); $t->date('payment_date')->nullable();
   $t->enum('status',['draft','calculating','review','approved','posted','paid','closed','cancelled'])->default('draft');
   $t->decimal('gross_total',16,2)->default(0); $t->decimal('deductions_total',16,2)->default(0);
   $t->decimal('employer_contributions_total',16,2)->default(0); $t->decimal('net_total',16,2)->default(0);
   $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
   $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
   $t->timestamp('approved_at')->nullable(); $t->json('meta')->nullable(); $t->timestamps();
  });
  Schema::create('hr_payroll_run_employees', function(Blueprint $t){
   $t->id(); $t->foreignId('payroll_run_id')->constrained('hr_payroll_runs_v2')->cascadeOnDelete();
   $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->decimal('basic_salary',14,2)->default(0); $t->decimal('earnings',14,2)->default(0);
   $t->decimal('overtime',14,2)->default(0); $t->decimal('deductions',14,2)->default(0);
   $t->decimal('employer_contributions',14,2)->default(0); $t->decimal('gross_salary',14,2)->default(0);
   $t->decimal('net_salary',14,2)->default(0); $t->unsignedInteger('worked_minutes')->default(0);
   $t->unsignedInteger('overtime_minutes')->default(0); $t->unsignedInteger('late_minutes')->default(0);
   $t->unsignedInteger('absence_days')->default(0);
   $t->enum('status',['calculated','exception','approved','paid'])->default('calculated');
   $t->json('calculation_snapshot')->nullable(); $t->timestamps(); $t->unique(['payroll_run_id','employee_id']);
  });
  Schema::create('hr_payroll_run_lines', function(Blueprint $t){
   $t->id(); $t->foreignId('payroll_run_employee_id')->constrained('hr_payroll_run_employees')->cascadeOnDelete();
   $t->foreignId('salary_component_id')->nullable()->constrained('hr_salary_components')->nullOnDelete();
   $t->string('code',50); $t->string('name'); $t->enum('type',['earning','deduction','employer_contribution']);
   $t->decimal('quantity',12,4)->default(1); $t->decimal('rate',14,4)->default(0); $t->decimal('amount',14,2)->default(0);
   $t->string('source',50)->default('payroll'); $t->json('meta')->nullable(); $t->timestamps();
  });
  Schema::create('hr_employee_loans', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->string('loan_number',50)->unique(); $t->decimal('principal_amount',14,2); $t->decimal('balance_amount',14,2);
   $t->decimal('installment_amount',14,2); $t->date('start_date'); $t->enum('status',['draft','active','completed','cancelled'])->default('draft');
   $t->text('notes')->nullable(); $t->timestamps();
  });
  Schema::create('hr_payroll_finance_postings', function(Blueprint $t){
   $t->id(); $t->foreignId('payroll_run_id')->constrained('hr_payroll_runs_v2')->cascadeOnDelete();
   $t->string('posting_reference',80)->nullable(); $t->enum('status',['pending','posted','failed','reversed'])->default('pending');
   $t->unsignedBigInteger('journal_entry_id')->nullable(); $t->text('error_message')->nullable();
   $t->timestamp('posted_at')->nullable(); $t->json('snapshot')->nullable(); $t->timestamps();
  });
 }
 public function down(): void {
  Schema::dropIfExists('hr_payroll_finance_postings'); Schema::dropIfExists('hr_employee_loans');
  Schema::dropIfExists('hr_payroll_run_lines'); Schema::dropIfExists('hr_payroll_run_employees');
  Schema::dropIfExists('hr_payroll_runs_v2'); Schema::dropIfExists('hr_employee_compensations');
  Schema::dropIfExists('hr_salary_structure_components'); Schema::dropIfExists('hr_salary_components');
  Schema::dropIfExists('hr_salary_structures');
 }
};