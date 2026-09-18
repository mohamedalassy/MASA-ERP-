<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_product_stocks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->decimal('stock_quantity', 14, 2)->default(0);
            $table->decimal('reserved_quantity', 14, 2)->default(0);
            $table->decimal('average_cost', 15, 2)->default(0);

            $table->decimal('minimum_stock', 14, 2)->default(0);
            $table->decimal('maximum_stock', 14, 2)->default(0);
            $table->decimal('reorder_point', 14, 2)->default(0);

            $table->timestamps();

            $table->unique(['branch_id', 'product_id']);
            $table->index(['branch_id', 'stock_quantity']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_product_stocks');
    }
};
