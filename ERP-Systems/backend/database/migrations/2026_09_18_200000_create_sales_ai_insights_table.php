<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_ai_insights', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
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

            $table->foreignId('sales_order_id')
                ->nullable()
                ->constrained('sales_orders')
                ->nullOnDelete();

            $table->foreignId('sales_contract_id')
                ->nullable()
                ->constrained('sales_contracts')
                ->nullOnDelete();

            $table->string('insight_type', 100);
            $table->string('severity', 30)->default('medium');

            $table->string('title');
            $table->text('summary')->nullable();
            $table->longText('reasoning')->nullable();
            $table->text('recommended_action')->nullable();

            $table->decimal('score', 7, 2)->nullable();
            $table->decimal('confidence', 7, 2)->nullable();

            $table->string('status', 30)->default('open');
            $table->string('generated_by', 100)->default('rules_engine');

            $table->timestamp('generated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('resolved_at')->nullable();

            $table->foreignId('resolved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('resolution_notes')->nullable();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status', 'severity']);
            $table->index(['opportunity_id', 'insight_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_ai_insights');
    }
};
