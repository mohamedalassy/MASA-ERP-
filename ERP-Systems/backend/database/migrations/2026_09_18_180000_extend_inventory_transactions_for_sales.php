<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_transactions', 'sales_order_id')) {
                $table->foreignId('sales_order_id')
                    ->nullable()
                    ->after('purchase_order_item_id')
                    ->constrained('sales_orders')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('inventory_transactions', 'sales_order_item_id')) {
                $table->foreignId('sales_order_item_id')
                    ->nullable()
                    ->after('sales_order_id')
                    ->constrained('sales_order_items')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('inventory_transactions', 'sales_delivery_id')) {
                $table->unsignedBigInteger('sales_delivery_id')
                    ->nullable()
                    ->after('sales_order_item_id');
            }
        });
    }

    public function down(): void
    {
        // Non-destructive migration.
    }
};
