<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('hr_requisitions',function(Blueprint $t){
   $t->id();$t->string('requisition_number',50)->unique();$t->string('title');
   $t->foreignId('department_id')->nullable()->constrained('hr_departments')->nullOnDelete();
   $t->foreignId('position_id')->nullable()->constrained('hr_positions')->nullOnDelete();
   $t->foreignId('hiring_manager_id')->nullable()->constrained('hr_employees')->nullOnDelete();
   $t->unsignedInteger('headcount')->default(1);$t->decimal('budget_min',14,2)->nullable();$t->decimal('budget_max',14,2)->nullable();
   $t->enum('employment_type',['full_time','part_time','contract','temporary','intern'])->default('full_time');
   $t->enum('status',['draft','pending_approval','approved','open','on_hold','filled','cancelled'])->default('draft');
   $t->text('description')->nullable();$t->json('requirements')->nullable();$t->date('target_date')->nullable();
   $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();$t->timestamps();
  });
  Schema::create('hr_candidates',function(Blueprint $t){
   $t->id();$t->string('candidate_number',50)->unique();$t->string('first_name');$t->string('last_name')->nullable();
   $t->string('email')->nullable();$t->string('mobile',40)->nullable();$t->string('nationality',80)->nullable();
   $t->string('city',100)->nullable();$t->string('current_title')->nullable();$t->decimal('years_experience',5,2)->nullable();
   $t->string('source',80)->nullable();$t->string('cv_path')->nullable();$t->json('skills')->nullable();
   $t->enum('status',['new','active','hired','rejected','withdrawn','talent_pool'])->default('new');$t->json('meta')->nullable();$t->timestamps();
  });
  Schema::create('hr_applications',function(Blueprint $t){
   $t->id();$t->foreignId('requisition_id')->constrained('hr_requisitions')->cascadeOnDelete();
   $t->foreignId('candidate_id')->constrained('hr_candidates')->cascadeOnDelete();
   $t->string('stage',60)->default('applied');$t->enum('status',['active','offer','hired','rejected','withdrawn'])->default('active');
   $t->decimal('match_score',5,2)->nullable();$t->json('match_explanation')->nullable();$t->text('notes')->nullable();
   $t->timestamps();$t->unique(['requisition_id','candidate_id']);
  });
  Schema::create('hr_interviews',function(Blueprint $t){
   $t->id();$t->foreignId('application_id')->constrained('hr_applications')->cascadeOnDelete();
   $t->string('interview_type',50)->default('technical');$t->timestamp('scheduled_at')->nullable();$t->unsignedInteger('duration_minutes')->default(30);
   $t->string('location')->nullable();$t->enum('status',['scheduled','completed','cancelled','no_show'])->default('scheduled');
   $t->decimal('score',5,2)->nullable();$t->json('scorecard')->nullable();$t->text('feedback')->nullable();$t->timestamps();
  });
  Schema::create('hr_offers',function(Blueprint $t){
   $t->id();$t->foreignId('application_id')->constrained('hr_applications')->cascadeOnDelete();$t->string('offer_number',50)->unique();
   $t->decimal('basic_salary',14,2)->default(0);$t->json('allowances')->nullable();$t->string('currency',3)->default('SAR');
   $t->date('proposed_start_date')->nullable();$t->enum('status',['draft','approval','sent','accepted','declined','expired','cancelled'])->default('draft');
   $t->timestamp('sent_at')->nullable();$t->timestamp('responded_at')->nullable();$t->date('expires_at')->nullable();$t->timestamps();
  });
  Schema::create('hr_onboarding_templates',function(Blueprint $t){
   $t->id();$t->string('code',50)->unique();$t->string('name');$t->foreignId('department_id')->nullable()->constrained('hr_departments')->nullOnDelete();
   $t->boolean('is_active')->default(true);$t->json('settings')->nullable();$t->timestamps();
  });
  Schema::create('hr_onboarding_template_tasks',function(Blueprint $t){
   $t->id();$t->foreignId('template_id')->constrained('hr_onboarding_templates')->cascadeOnDelete();$t->string('title');
   $t->string('owner_type',50)->default('hr');$t->integer('due_offset_days')->default(0);$t->boolean('required')->default(true);
   $t->json('automation')->nullable();$t->unsignedInteger('sort_order')->default(0);$t->timestamps();
  });
  Schema::create('hr_employee_onboardings',function(Blueprint $t){
   $t->id();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->foreignId('template_id')->nullable()->constrained('hr_onboarding_templates')->nullOnDelete();$t->date('start_date');
   $t->enum('status',['planned','in_progress','completed','cancelled'])->default('planned');$t->unsignedInteger('progress')->default(0);$t->timestamps();
  });
  Schema::create('hr_employee_onboarding_tasks',function(Blueprint $t){
   $t->id();$t->foreignId('onboarding_id')->constrained('hr_employee_onboardings')->cascadeOnDelete();$t->string('title');
   $t->string('owner_type',50)->default('hr');$t->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
   $t->date('due_date')->nullable();$t->enum('status',['pending','in_progress','done','skipped'])->default('pending');
   $t->timestamp('completed_at')->nullable();$t->text('notes')->nullable();$t->timestamps();
  });
 }
 public function down(): void {
  Schema::dropIfExists('hr_employee_onboarding_tasks');Schema::dropIfExists('hr_employee_onboardings');
  Schema::dropIfExists('hr_onboarding_template_tasks');Schema::dropIfExists('hr_onboarding_templates');
  Schema::dropIfExists('hr_offers');Schema::dropIfExists('hr_interviews');Schema::dropIfExists('hr_applications');
  Schema::dropIfExists('hr_candidates');Schema::dropIfExists('hr_requisitions');
 }
};