<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_contract_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sales_contract_id')
                ->constrained('sales_contracts')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->text('description')->nullable();
            $table->decimal('quantity', 12, 2)->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);

            $table->date('service_start_date')->nullable();
            $table->date('service_end_date')->nullable();

            $table->timestamps();

            $table->index('sales_contract_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_contract_items');
    }
};
