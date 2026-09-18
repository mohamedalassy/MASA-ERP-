<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_contracts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->foreignId('sales_order_id')
                ->nullable()
                ->constrained('sales_orders')
                ->nullOnDelete();

            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();

            $table->string('contract_number', 100)->unique();
            $table->string('type', 100);
            $table->string('status', 30)->default('draft');
            $table->string('title')->nullable();

            $table->date('start_date');
            $table->date('end_date')->nullable();

            $table->decimal('value', 15, 2)->default(0);
            $table->text('payment_terms')->nullable();

            $table->unsignedInteger('renewal_notice_days')->default(60);
            $table->boolean('auto_renew')->default(false);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['customer_id', 'status']);
            $table->index('end_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_contracts');
    }
};
