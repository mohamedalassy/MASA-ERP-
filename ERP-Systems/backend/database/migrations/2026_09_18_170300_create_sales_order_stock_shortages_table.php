<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_order_stock_shortages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('sales_order_id')
                ->constrained('sales_orders')
                ->cascadeOnDelete();

            $table->foreignId('sales_order_item_id')
                ->constrained('sales_order_items')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->decimal('required_quantity', 12, 2)->default(0);
            $table->decimal('available_quantity', 12, 2)->default(0);
            $table->decimal('shortage_quantity', 12, 2)->default(0);

            $table->string('status', 40)->default('open');

            $table->foreignId('purchase_order_id')
                ->nullable()
                ->constrained('purchase_orders')
                ->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['sales_order_id', 'status']);
            $table->index(['branch_id', 'product_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_stock_shortages');
    }
};
