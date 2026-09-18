<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_ai_recommendations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('customers')
                ->nullOnDelete();

            $table->foreignId('opportunity_id')
                ->nullable()
                ->constrained('sales_opportunities')
                ->nullOnDelete();

            $table->string('recommendation_type', 50);

            $table->foreignId('source_product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->foreignId('recommended_product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->string('title');
            $table->text('reason')->nullable();

            $table->decimal('estimated_value', 15, 2)->default(0);
            $table->decimal('score', 7, 2)->default(0);

            $table->string('status', 30)->default('open');
            $table->json('metadata')->nullable();

            $table->timestamp('generated_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status', 'recommendation_type']);
            $table->index(['customer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_ai_recommendations');
    }
};
