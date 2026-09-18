<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('hr_approval_requests',function(Blueprint $t){
   $t->id();$t->string('request_number',60)->unique();$t->string('request_type',80);$t->unsignedBigInteger('subject_id')->nullable();
   $t->foreignId('employee_id')->nullable()->constrained('hr_employees')->nullOnDelete();$t->string('title');$t->json('payload')->nullable();
   $t->enum('status',['pending','approved','rejected','cancelled'])->default('pending');$t->unsignedInteger('current_step')->default(1);
   $t->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();$t->timestamp('completed_at')->nullable();$t->timestamps();
   $t->index(['request_type','status']);
  });
  Schema::create('hr_approval_steps',function(Blueprint $t){
   $t->id();$t->foreignId('approval_request_id')->constrained('hr_approval_requests')->cascadeOnDelete();$t->unsignedInteger('step_number');
   $t->string('approver_type',40)->default('user');$t->unsignedBigInteger('approver_id')->nullable();
   $t->enum('status',['pending','approved','rejected','skipped'])->default('pending');$t->text('comment')->nullable();
   $t->timestamp('acted_at')->nullable();$t->timestamps();$t->unique(['approval_request_id','step_number']);
  });
  Schema::create('hr_automation_rules',function(Blueprint $t){
   $t->id();$t->string('code',70)->unique();$t->string('name');$t->string('trigger_event',100);
   $t->json('conditions')->nullable();$t->json('actions');$t->boolean('is_active')->default(true);
   $t->unsignedInteger('execution_order')->default(100);$t->timestamps();
  });
  Schema::create('hr_automation_runs',function(Blueprint $t){
   $t->id();$t->foreignId('rule_id')->constrained('hr_automation_rules')->cascadeOnDelete();$t->string('trigger_reference')->nullable();
   $t->enum('status',['queued','running','success','partial','failed'])->default('queued');$t->json('input')->nullable();$t->json('output')->nullable();
   $t->text('error_message')->nullable();$t->timestamp('started_at')->nullable();$t->timestamp('finished_at')->nullable();$t->timestamps();
  });
  Schema::create('hr_workforce_plans',function(Blueprint $t){
   $t->id();$t->string('name');$t->unsignedSmallInteger('year');$t->foreignId('department_id')->nullable()->constrained('hr_departments')->nullOnDelete();
   $t->unsignedInteger('current_headcount')->default(0);$t->unsignedInteger('planned_headcount')->default(0);
   $t->decimal('current_cost',16,2)->default(0);$t->decimal('budgeted_cost',16,2)->default(0);
   $t->enum('status',['draft','review','approved','locked'])->default('draft');$t->json('assumptions')->nullable();$t->timestamps();
  });
  Schema::create('hr_erp_integration_events',function(Blueprint $t){
   $t->id();$t->string('event_type',100);$t->string('source_module',50)->default('hr');$t->string('target_module',50);
   $t->unsignedBigInteger('employee_id')->nullable();$t->string('reference_type',80)->nullable();$t->unsignedBigInteger('reference_id')->nullable();
   $t->enum('status',['pending','processing','completed','failed','ignored'])->default('pending');$t->json('payload')->nullable();
   $t->unsignedInteger('attempts')->default(0);$t->text('last_error')->nullable();$t->timestamp('processed_at')->nullable();$t->timestamps();
   $t->index(['target_module','status']);
  });
 }
 public function down(): void {
  Schema::dropIfExists('hr_erp_integration_events');Schema::dropIfExists('hr_workforce_plans');Schema::dropIfExists('hr_automation_runs');
  Schema::dropIfExists('hr_automation_rules');Schema::dropIfExists('hr_approval_steps');Schema::dropIfExists('hr_approval_requests');
 }
};