<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sales_order_id')
                ->constrained('sales_orders')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->string('product_name');
            $table->string('sku')->nullable();
            $table->text('description')->nullable();
            $table->string('unit')->nullable();
            $table->string('item_type', 30)->default('inventory');

            $table->decimal('quantity', 12, 2)->default(1);
            $table->decimal('reserved_quantity', 12, 2)->default(0);
            $table->decimal('shortage_quantity', 12, 2)->default(0);

            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(15);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);

            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('sales_order_id');
            $table->index('product_id');
            $table->index('sku');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_items');
    }
};
