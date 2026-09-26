<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('hr_device_employee_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained('hr_attendance_devices')->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained('hr_employees')->cascadeOnDelete();
            $table->string('biometric_user_id', 60);
            $table->timestamps();
            $table->unique(['device_id', 'biometric_user_id']);
            $table->unique(['device_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_device_employee_mappings');
    }
};
