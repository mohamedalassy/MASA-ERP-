<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_revenue_leakages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('sales_order_id')->nullable()->constrained('sales_orders')->nullOnDelete();
            $table->foreignId('sales_invoice_id')->nullable()->constrained('sales_invoices')->nullOnDelete();
            $table->foreignId('sales_contract_id')->nullable()->constrained('sales_contracts')->nullOnDelete();
            $table->foreignId('quotation_id')->nullable()->constrained('project_quotations')->nullOnDelete();
            $table->string('source_type', 100);
            $table->string('source_reference')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->string('severity', 30)->default('medium');
            $table->string('status', 30)->default('open');
            $table->timestamp('detected_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status', 'severity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_revenue_leakages');
    }
};
