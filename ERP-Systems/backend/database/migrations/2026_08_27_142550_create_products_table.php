<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // التعريف الأساسي
            $table->string('sku')->unique();
            $table->string('name');

            $table->string('category')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();

            $table->text('description')->nullable();

            // وحدة القياس
            $table->string('unit')->default('pcs');

            // الأسعار
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->decimal('default_sale_price', 15, 2)->default(0);

            // الضريبة
            $table->decimal('tax_rate', 5, 2)->default(15);

            // المخزون
            $table->decimal('stock_quantity', 15, 2)->default(0);
            $table->decimal('minimum_stock', 15, 2)->default(0);

            // المورد الافتراضي
            $table->string('default_supplier')->nullable();

            // بيانات إضافية
            $table->string('barcode')->nullable();
            $table->string('image_path')->nullable();

            // حالة المنتج
            $table->boolean('is_active')->default(true);

            // من أنشأ المنتج
            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('name');
            $table->index('category');
            $table->index('brand');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};