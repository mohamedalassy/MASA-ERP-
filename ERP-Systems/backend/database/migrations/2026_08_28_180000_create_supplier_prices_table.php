<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('supplier_prices')) {
            Schema::create('supplier_prices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('supplier_id')->constrained('suppliers')->cascadeOnDelete();
                $table->decimal('unit_price', 14, 2);
                $table->string('currency', 10)->default('SAR');
                $table->decimal('minimum_order_quantity', 12, 2)->default(1);
                $table->unsignedInteger('lead_time_days')->nullable();
                $table->date('valid_from')->nullable();
                $table->date('valid_until')->nullable();
                $table->string('payment_terms', 1000)->nullable();
                $table->string('warranty_terms', 1000)->nullable();
                $table->text('notes')->nullable();
                $table->boolean('is_preferred')->default(false);
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['product_id', 'is_active']);
                $table->index(['supplier_id', 'is_active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_prices');
    }
};
