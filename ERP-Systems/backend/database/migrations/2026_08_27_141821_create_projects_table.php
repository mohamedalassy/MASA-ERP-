<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();

            // Project
            $table->string('project_code')->unique();
            $table->string('name');

            // Customer
            $table->string('customer_name');
            $table->string('customer_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('address')->nullable();
            $table->string('commercial_register')->nullable();
            $table->string('tax_number')->nullable();

            // Project Team
            $table->string('project_manager')->nullable();
            $table->string('account_manager')->nullable();

            // Workflow
            $table->string('current_stage')->default('crm');
            $table->string('status')->default('active');

            // Project Details
            $table->string('project_type')->nullable();
            $table->string('priority')->default('normal');

            $table->date('expected_start_date')->nullable();
            $table->date('expected_end_date')->nullable();

            $table->decimal('total_value', 15, 2)->default(0);

            // User
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('project_code');
            $table->index('current_stage');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};