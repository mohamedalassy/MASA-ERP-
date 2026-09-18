<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {

            if (!Schema::hasColumn('audit_logs', 'user_id')) {
                $table->foreignId('user_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('audit_logs', 'action')) {
                $table->string('action')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'module')) {
                $table->string('module')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'record_id')) {
                $table->unsignedBigInteger('record_id')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'title')) {
                $table->string('title')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'description')) {
                $table->text('description')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'old_values')) {
                $table->json('old_values')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'new_values')) {
                $table->json('new_values')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'ip_address')) {
                $table->string('ip_address')->nullable();
            }

            if (!Schema::hasColumn('audit_logs', 'user_agent')) {
                $table->text('user_agent')->nullable();
            }
        });
    }

    public function down(): void
    {
        //
    }
};