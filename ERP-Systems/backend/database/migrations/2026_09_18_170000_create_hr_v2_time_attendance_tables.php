<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('hr_attendance_policies', function(Blueprint $t){
   $t->id(); $t->string('code',40)->unique(); $t->string('name');
   $t->unsignedInteger('late_grace_minutes')->default(0);
   $t->unsignedInteger('early_leave_grace_minutes')->default(0);
   $t->unsignedInteger('minimum_work_minutes')->default(480);
   $t->unsignedInteger('overtime_after_minutes')->default(0);
   $t->boolean('allow_remote')->default(false); $t->boolean('require_geofence')->default(false);
   $t->json('working_days')->nullable(); $t->json('settings')->nullable();
   $t->boolean('is_active')->default(true); $t->timestamps();
  });
  Schema::create('hr_geofences', function(Blueprint $t){
   $t->id(); $t->foreignId('branch_id')->nullable()->constrained('hr_branches')->nullOnDelete();
   $t->string('name'); $t->decimal('latitude',10,7); $t->decimal('longitude',10,7);
   $t->unsignedInteger('radius_meters')->default(100); $t->boolean('is_active')->default(true); $t->timestamps();
  });
  Schema::create('hr_rosters', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->foreignId('shift_id')->nullable()->constrained('hr_shifts')->nullOnDelete();
   $t->date('work_date'); $t->time('planned_start')->nullable(); $t->time('planned_end')->nullable();
   $t->enum('status',['scheduled','day_off','leave','holiday','cancelled'])->default('scheduled');
   $t->text('notes')->nullable(); $t->timestamps(); $t->unique(['employee_id','work_date']);
  });
  Schema::create('hr_attendance_events', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->foreignId('attendance_device_id')->nullable()->constrained('hr_attendance_devices')->nullOnDelete();
   $t->enum('event_type',['check_in','check_out','break_start','break_end'])->default('check_in');
   $t->timestamp('event_at'); $t->enum('source',['device','mobile','web','manual','import'])->default('device');
   $t->decimal('latitude',10,7)->nullable(); $t->decimal('longitude',10,7)->nullable();
   $t->boolean('inside_geofence')->nullable(); $t->string('external_event_id',120)->nullable();
   $t->json('meta')->nullable(); $t->timestamps(); $t->index(['employee_id','event_at']);
  });
  Schema::create('hr_attendance_daily_summaries', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->date('work_date'); $t->timestamp('first_in')->nullable(); $t->timestamp('last_out')->nullable();
   $t->unsignedInteger('worked_minutes')->default(0); $t->unsignedInteger('late_minutes')->default(0);
   $t->unsignedInteger('early_leave_minutes')->default(0); $t->unsignedInteger('overtime_minutes')->default(0);
   $t->unsignedInteger('break_minutes')->default(0);
   $t->enum('status',['present','absent','late','leave','holiday','day_off','incomplete'])->default('incomplete');
   $t->json('exceptions')->nullable(); $t->timestamps(); $t->unique(['employee_id','work_date']);
  });
  Schema::create('hr_attendance_correction_requests', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->date('work_date'); $t->timestamp('requested_check_in')->nullable(); $t->timestamp('requested_check_out')->nullable();
   $t->text('reason'); $t->enum('status',['pending','approved','rejected','cancelled'])->default('pending');
   $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete(); $t->text('review_notes')->nullable();
   $t->timestamp('reviewed_at')->nullable(); $t->timestamps();
  });
  Schema::create('hr_overtime_requests', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->date('work_date'); $t->unsignedInteger('requested_minutes'); $t->unsignedInteger('approved_minutes')->default(0);
   $t->text('reason')->nullable(); $t->enum('status',['pending','approved','rejected','cancelled'])->default('pending');
   $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamp('approved_at')->nullable(); $t->timestamps();
  });
  Schema::create('hr_leave_requests', function(Blueprint $t){
   $t->id(); $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
   $t->string('leave_type',50); $t->date('start_date'); $t->date('end_date'); $t->decimal('days',6,2);
   $t->text('reason')->nullable(); $t->enum('status',['draft','pending','approved','rejected','cancelled'])->default('pending');
   $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete(); $t->timestamp('approved_at')->nullable(); $t->timestamps();
  });
  Schema::create('hr_device_sync_logs', function(Blueprint $t){
   $t->id(); $t->foreignId('attendance_device_id')->constrained('hr_attendance_devices')->cascadeOnDelete();
   $t->enum('direction',['pull','push'])->default('pull'); $t->enum('status',['success','partial','failed'])->default('success');
   $t->unsignedInteger('records_received')->default(0); $t->unsignedInteger('records_created')->default(0);
   $t->unsignedInteger('records_failed')->default(0); $t->text('message')->nullable();
   $t->timestamp('started_at')->nullable(); $t->timestamp('finished_at')->nullable(); $t->json('meta')->nullable(); $t->timestamps();
  });
 }
 public function down(): void {
  Schema::dropIfExists('hr_device_sync_logs'); Schema::dropIfExists('hr_leave_requests');
  Schema::dropIfExists('hr_overtime_requests'); Schema::dropIfExists('hr_attendance_correction_requests');
  Schema::dropIfExists('hr_attendance_daily_summaries'); Schema::dropIfExists('hr_attendance_events');
  Schema::dropIfExists('hr_rosters'); Schema::dropIfExists('hr_geofences'); Schema::dropIfExists('hr_attendance_policies');
 }
};