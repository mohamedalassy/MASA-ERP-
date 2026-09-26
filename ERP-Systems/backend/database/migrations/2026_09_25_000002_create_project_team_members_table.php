<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::create('project_team_members', function(Blueprint $table){
  $table->id(); $table->foreignId('project_id')->constrained()->cascadeOnDelete();
  $table->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
  $table->string('role',120)->nullable(); $table->date('start_date')->nullable(); $table->date('end_date')->nullable();
  $table->boolean('attendance_enabled')->default(true); $table->boolean('is_active')->default(true);
  $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete(); $table->text('notes')->nullable(); $table->timestamps();
  $table->unique(['project_id','employee_id']); $table->index(['project_id','is_active']);
 });}
 public function down(): void { Schema::dropIfExists('project_team_members'); }
};