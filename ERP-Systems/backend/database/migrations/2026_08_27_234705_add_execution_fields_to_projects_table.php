<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('execution_status')
                ->nullable()
                ->after('current_stage');

            $table->text('execution_hold_reason')
                ->nullable()
                ->after('execution_status');

            $table->timestamp('execution_hold_at')
                ->nullable()
                ->after('execution_hold_reason');

            $table->timestamp('execution_resumed_at')
                ->nullable()
                ->after('execution_hold_at');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'execution_status',
                'execution_hold_reason',
                'execution_hold_at',
                'execution_resumed_at',
            ]);
        });
    }
};