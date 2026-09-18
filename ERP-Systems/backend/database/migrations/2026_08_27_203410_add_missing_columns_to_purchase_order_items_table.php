<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_order_items', function (Blueprint $table) {

            if (!Schema::hasColumn('purchase_order_items', 'product_id')) {
                $table->foreignId('product_id')
                    ->nullable()
                    ->after('purchase_order_id')
                    ->constrained('products')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('purchase_order_items', 'product_name')) {
                $table->string('product_name')
                    ->nullable();
            }

            if (!Schema::hasColumn('purchase_order_items', 'sku')) {
                $table->string('sku')
                    ->nullable();
            }

            if (!Schema::hasColumn('purchase_order_items', 'description')) {
                $table->text('description')
                    ->nullable();
            }

            if (!Schema::hasColumn('purchase_order_items', 'quantity')) {
                $table->decimal('quantity', 12, 2)
                    ->default(1);
            }

            if (!Schema::hasColumn('purchase_order_items', 'received_quantity')) {
                $table->decimal('received_quantity', 12, 2)
                    ->default(0);
            }

            if (!Schema::hasColumn('purchase_order_items', 'unit_cost')) {
                $table->decimal('unit_cost', 15, 2)
                    ->default(0);
            }

            if (!Schema::hasColumn('purchase_order_items', 'discount')) {
                $table->decimal('discount', 15, 2)
                    ->default(0);
            }

            if (!Schema::hasColumn('purchase_order_items', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)
                    ->default(15);
            }

            if (!Schema::hasColumn('purchase_order_items', 'tax_amount')) {
                $table->decimal('tax_amount', 15, 2)
                    ->default(0);
            }

            if (!Schema::hasColumn('purchase_order_items', 'line_total')) {
                $table->decimal('line_total', 15, 2)
                    ->default(0);
            }
        });
    }

    public function down(): void
    {
        // نخليها فاضية مؤقتًا عشان ما نمسحش بيانات بالغلط
    }
};