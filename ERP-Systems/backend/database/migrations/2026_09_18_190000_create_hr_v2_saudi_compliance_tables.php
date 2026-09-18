<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('hr_employee_government_records',function(Blueprint $t){
   $t->id();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->string('record_type',50);$t->string('record_number',120)->nullable();$t->date('issue_date')->nullable();
   $t->date('expiry_date')->nullable();$t->string('status',40)->default('active');$t->string('issuer',80)->nullable();
   $t->json('meta')->nullable();$t->timestamps();$t->index(['employee_id','record_type']);$t->index('expiry_date');
  });
  Schema::create('hr_compliance_checks',function(Blueprint $t){
   $t->id();$t->foreignId('employee_id')->nullable()->constrained('hr_employees')->nullOnDelete();
   $t->string('check_code',80);$t->string('category',60);$t->enum('result',['pass','warning','fail','unknown'])->default('unknown');
   $t->enum('severity',['info','low','medium','high','critical'])->default('medium');$t->string('title');$t->text('details')->nullable();
   $t->date('due_date')->nullable();$t->json('evidence')->nullable();$t->timestamp('checked_at')->nullable();$t->timestamps();
   $t->index(['result','severity']);
  });
  Schema::create('hr_government_connector_capabilities',function(Blueprint $t){
   $t->id();$t->foreignId('connector_id')->constrained('hr_government_connectors')->cascadeOnDelete();
   $t->string('capability_code',80);$t->string('name');$t->enum('mode',['api','file','manual','redirect','unavailable'])->default('manual');
   $t->boolean('enabled')->default(false);$t->json('configuration')->nullable();$t->timestamps();$t->unique(['connector_id','capability_code']);
  });
  Schema::create('hr_wps_batches',function(Blueprint $t){
   $t->id();$t->foreignId('payroll_run_id')->nullable()->constrained('hr_payroll_runs_v2')->nullOnDelete();
   $t->string('batch_number',60)->unique();$t->date('salary_month');$t->enum('status',['draft','generated','submitted','accepted','rejected'])->default('draft');
   $t->string('file_name')->nullable();$t->string('file_hash',128)->nullable();$t->timestamp('generated_at')->nullable();
   $t->timestamp('submitted_at')->nullable();$t->text('response_message')->nullable();$t->json('meta')->nullable();$t->timestamps();
  });
  Schema::create('hr_wps_batch_lines',function(Blueprint $t){
   $t->id();$t->foreignId('wps_batch_id')->constrained('hr_wps_batches')->cascadeOnDelete();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->string('iban',50)->nullable();$t->decimal('basic_salary',14,2)->default(0);$t->decimal('housing_allowance',14,2)->default(0);
   $t->decimal('other_earnings',14,2)->default(0);$t->decimal('deductions',14,2)->default(0);$t->decimal('net_salary',14,2)->default(0);
   $t->enum('status',['ready','warning','invalid'])->default('ready');$t->json('validation_errors')->nullable();$t->timestamps();
  });
  Schema::create('hr_gosi_snapshots',function(Blueprint $t){
   $t->id();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();$t->date('effective_month');
   $t->decimal('basic_salary',14,2)->default(0);$t->decimal('housing_allowance',14,2)->default(0);$t->decimal('contributory_wage',14,2)->default(0);
   $t->decimal('employee_contribution',14,2)->default(0);$t->decimal('employer_contribution',14,2)->default(0);
   $t->string('calculation_version',40)->nullable();$t->json('calculation_details')->nullable();$t->enum('status',['draft','reviewed','submitted','matched','mismatch'])->default('draft');
   $t->timestamps();$t->unique(['employee_id','effective_month']);
  });
 }
 public function down(): void {
  Schema::dropIfExists('hr_gosi_snapshots');Schema::dropIfExists('hr_wps_batch_lines');Schema::dropIfExists('hr_wps_batches');
  Schema::dropIfExists('hr_government_connector_capabilities');Schema::dropIfExists('hr_compliance_checks');Schema::dropIfExists('hr_employee_government_records');
 }
};