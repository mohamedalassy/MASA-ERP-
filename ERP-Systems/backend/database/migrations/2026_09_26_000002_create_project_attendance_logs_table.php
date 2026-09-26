<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::create('project_attendance_logs',function(Blueprint $t){
  $t->id(); $t->foreignId('project_id')->constrained()->cascadeOnDelete();
  $t->foreignId('project_team_member_id')->nullable()->constrained('project_team_members')->nullOnDelete();
  $t->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
  $t->string('event_type',20); $t->timestamp('recorded_at');
  $t->decimal('latitude',10,7); $t->decimal('longitude',10,7);
  $t->decimal('accuracy_meters',10,2)->nullable(); $t->decimal('distance_meters',10,2);
  $t->unsignedInteger('geofence_radius'); $t->boolean('inside_geofence')->default(true);
  $t->string('source',40)->default('project_gps'); $t->ipAddress('ip_address')->nullable();
  $t->text('user_agent')->nullable(); $t->json('metadata')->nullable(); $t->timestamps();
  $t->index(['project_id','recorded_at']); $t->index(['employee_id','recorded_at']);
 });}
 public function down(): void { Schema::dropIfExists('project_attendance_logs'); }
};