<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_deliveries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('sales_order_id')
                ->constrained('sales_orders')
                ->cascadeOnDelete();

            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();

            $table->string('delivery_number', 100)->unique();
            $table->string('status', 30)->default('draft');
            $table->date('delivery_date')->nullable();

            $table->foreignId('delivered_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('received_by_name')->nullable();
            $table->string('received_by_phone', 100)->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['sales_order_id', 'status']);
        });

        Schema::create('sales_delivery_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sales_delivery_id')
                ->constrained('sales_deliveries')
                ->cascadeOnDelete();

            $table->foreignId('sales_order_item_id')
                ->constrained('sales_order_items')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('unit_cost', 15, 2)->default(0);

            $table->timestamps();
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->foreign('sales_delivery_id')
                ->references('id')
                ->on('sales_deliveries')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_delivery_items');
        Schema::dropIfExists('sales_deliveries');
    }
};
