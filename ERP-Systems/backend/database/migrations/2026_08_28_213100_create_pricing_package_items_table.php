<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_package_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pricing_package_id')
                ->constrained('pricing_packages')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->string('product_name_snapshot');
            $table->string('sku_snapshot')->nullable();
            $table->string('unit')->default('قطعة');

            $table->decimal('quantity', 12, 2)->default(1);
            $table->decimal('cost_price', 14, 2)->default(0);
            $table->decimal('sale_price', 14, 2)->default(0);
            $table->decimal('discount_percent', 8, 2)->default(0);

            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_package_items');
    }
};
