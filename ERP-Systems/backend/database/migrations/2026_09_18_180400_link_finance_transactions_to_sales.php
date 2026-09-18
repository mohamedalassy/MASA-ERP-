<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_financial_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('project_financial_transactions', 'sales_order_id')) {
                $table->foreignId('sales_order_id')
                    ->nullable()
                    ->constrained('sales_orders')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'sales_invoice_id')) {
                $table->foreignId('sales_invoice_id')
                    ->nullable()
                    ->constrained('sales_invoices')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('project_financial_transactions', 'sales_payment_id')) {
                $table->foreignId('sales_payment_id')
                    ->nullable()
                    ->constrained('sales_payments')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        // Non-destructive migration.
    }
};
