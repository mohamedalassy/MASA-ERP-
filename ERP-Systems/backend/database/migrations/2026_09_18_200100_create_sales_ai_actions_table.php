<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_ai_actions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            $table->foreignId('insight_id')
                ->nullable()
                ->constrained('sales_ai_insights')
                ->nullOnDelete();

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

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('action_type', 100);
            $table->string('title');
            $table->text('description')->nullable();

            $table->string('priority', 30)->default('normal');
            $table->string('status', 30)->default('open');

            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->text('outcome')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status', 'priority']);
            $table->index(['assigned_to', 'status', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_ai_actions');
    }
};
