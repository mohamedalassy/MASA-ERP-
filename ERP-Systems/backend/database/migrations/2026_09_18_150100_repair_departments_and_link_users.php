<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('departments', 'code')) {
                $table->string('code', 50)->nullable();
            }

            if (!Schema::hasColumn('departments', 'name')) {
                $table->string('name')->nullable();
            }

            if (!Schema::hasColumn('departments', 'name_en')) {
                $table->string('name_en')->nullable();
            }

            if (!Schema::hasColumn('departments', 'description')) {
                $table->text('description')->nullable();
            }

            if (!Schema::hasColumn('departments', 'manager_id')) {
                $table->foreignId('manager_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('departments', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'department_id')) {
                $table->foreignId('department_id')
                    ->nullable()
                    ->after('branch_id')
                    ->constrained('departments')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('users', 'job_title')) {
                $table->string('job_title')->nullable();
            }

            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true);
            }
        });
    }

    public function down(): void
    {
        // Non-destructive foundation migration.
    }
};
