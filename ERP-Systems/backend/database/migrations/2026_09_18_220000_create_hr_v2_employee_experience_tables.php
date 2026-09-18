<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void {
  Schema::create('hr_service_requests',function(Blueprint $t){
   $t->id();$t->string('request_number',50)->unique();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->string('category',60);$t->string('subject');$t->text('description')->nullable();
   $t->enum('priority',['low','normal','high','urgent'])->default('normal');
   $t->enum('status',['open','in_progress','waiting_employee','resolved','closed','cancelled'])->default('open');
   $t->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();$t->timestamp('resolved_at')->nullable();$t->timestamps();
  });
  Schema::create('hr_letter_requests',function(Blueprint $t){
   $t->id();$t->string('request_number',50)->unique();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->string('letter_type',60);$t->string('language',10)->default('ar');$t->string('addressed_to')->nullable();
   $t->text('purpose')->nullable();$t->enum('status',['pending','approved','rejected','issued','cancelled'])->default('pending');
   $t->string('document_path')->nullable();$t->timestamp('issued_at')->nullable();$t->timestamps();
  });
  Schema::create('hr_announcements',function(Blueprint $t){
   $t->id();$t->string('title');$t->text('body');$t->enum('audience',['all','branch','department','custom'])->default('all');
   $t->json('audience_ids')->nullable();$t->timestamp('publish_at')->nullable();$t->timestamp('expires_at')->nullable();
   $t->boolean('is_pinned')->default(false);$t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();$t->timestamps();
  });
  Schema::create('hr_surveys',function(Blueprint $t){
   $t->id();$t->string('title');$t->string('survey_type',40)->default('pulse');$t->text('description')->nullable();
   $t->date('start_date')->nullable();$t->date('end_date')->nullable();$t->enum('status',['draft','active','closed'])->default('draft');
   $t->boolean('anonymous')->default(true);$t->json('questions')->nullable();$t->timestamps();
  });
  Schema::create('hr_survey_responses',function(Blueprint $t){
   $t->id();$t->foreignId('survey_id')->constrained('hr_surveys')->cascadeOnDelete();$t->foreignId('employee_id')->nullable()->constrained('hr_employees')->nullOnDelete();
   $t->json('answers');$t->integer('enps_score')->nullable();$t->timestamp('submitted_at')->nullable();$t->timestamps();
  });
  Schema::create('hr_employee_acknowledgements',function(Blueprint $t){
   $t->id();$t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();$t->string('document_type',50);
   $t->string('document_reference',120);$t->timestamp('acknowledged_at')->nullable();$t->string('ip_address',64)->nullable();
   $t->json('meta')->nullable();$t->timestamps();$t->unique(['employee_id','document_type','document_reference']);
  });
 }
 public function down(): void {
  Schema::dropIfExists('hr_employee_acknowledgements');Schema::dropIfExists('hr_survey_responses');Schema::dropIfExists('hr_surveys');
  Schema::dropIfExists('hr_announcements');Schema::dropIfExists('hr_letter_requests');Schema::dropIfExists('hr_service_requests');
 }
};