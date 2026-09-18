<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_workflow_history', function (Blueprint $table) {
            $table->id();

            // المشروع
            $table->foreignId('project_id')
                ->constrained('projects')
                ->cascadeOnDelete();

            // انتقال المشروع بين الأقسام
            $table->string('from_stage')->nullable();
            $table->string('to_stage');

            // حالة العملية
            $table->string('status')->default('completed');

            // الشخص الذي قام بالتحويل
            $table->foreignId('transferred_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // الشخص المستلم للمشروع
            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // ملاحظات التحويل
            $table->text('notes')->nullable();

            // تاريخ التحويل
            $table->timestamp('transferred_at')->nullable();

            $table->timestamps();

            $table->index('project_id');
            $table->index('to_stage');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_workflow_history');
    }
};
