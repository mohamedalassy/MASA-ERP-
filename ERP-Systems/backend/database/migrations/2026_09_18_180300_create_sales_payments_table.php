<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->foreignId('sales_invoice_id')
                ->constrained('sales_invoices')
                ->cascadeOnDelete();

            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();

            $table->string('payment_number', 100)->unique();
            $table->date('payment_date');
            $table->decimal('amount', 15, 2);

            $table->string('payment_method', 100)->nullable();
            $table->string('reference_number')->nullable();
            $table->string('status', 30)->default('posted');

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('posted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('posted_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'payment_date']);
            $table->index(['customer_id', 'payment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_payments');
    }
};
