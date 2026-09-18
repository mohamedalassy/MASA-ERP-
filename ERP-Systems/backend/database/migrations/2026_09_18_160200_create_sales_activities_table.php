<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_activities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('customers')
                ->nullOnDelete();

            $table->foreignId('lead_id')
                ->nullable()
                ->constrained('sales_leads')
                ->nullOnDelete();

            $table->foreignId('opportunity_id')
                ->nullable()
                ->constrained('sales_opportunities')
                ->nullOnDelete();

            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();

            $table->string('type', 30);
            $table->string('subject');
            $table->text('description')->nullable();

            $table->string('status', 20)->default('pending');
            $table->string('priority', 20)->default('normal');

            $table->timestamp('activity_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('outcome')->nullable();
            $table->text('next_action')->nullable();
            $table->timestamp('next_action_at')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['owner_id', 'due_at']);
            $table->index(['opportunity_id', 'activity_at']);
            $table->index(['lead_id', 'activity_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_activities');
    }
};
