<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_price_histories', function (Blueprint $table) {
            $table->id();

            $table->foreignId('supplier_price_id')
                ->nullable()
                ->constrained('supplier_prices')
                ->nullOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->cascadeOnDelete();

            $table->decimal('old_price', 14, 2)->nullable();
            $table->decimal('new_price', 14, 2);

            $table->string('currency', 10)->default('SAR');

            $table->unsignedInteger('old_lead_time_days')->nullable();
            $table->unsignedInteger('new_lead_time_days')->nullable();

            $table->date('old_valid_until')->nullable();
            $table->date('new_valid_until')->nullable();

            $table->string('change_type', 30)->default('price_update');

            $table->foreignId('changed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['product_id', 'supplier_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_price_histories');
    }
};