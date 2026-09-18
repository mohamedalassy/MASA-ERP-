<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_negotiations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('opportunity_id')
                ->nullable()
                ->constrained('sales_opportunities')
                ->nullOnDelete();

            $table->foreignId('quotation_id')
                ->nullable()
                ->constrained('project_quotations')
                ->nullOnDelete();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->string('type', 50);
            $table->string('subject');
            $table->text('details')->nullable();

            $table->decimal('requested_value', 15, 2)->nullable();
            $table->decimal('approved_value', 15, 2)->nullable();

            $table->string('status', 30)->default('open');

            $table->foreignId('requested_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['opportunity_id', 'status']);
            $table->index(['quotation_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_negotiations');
    }
};
