<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_alternatives', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->foreignId('alternative_product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->unsignedInteger('priority')->default(100);
            $table->boolean('is_preferred')->default(false);
            $table->boolean('is_active')->default(true);

            $table->string('reason', 1000)->nullable();
            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->unique(
                ['product_id', 'alternative_product_id'],
                'product_alternatives_unique'
            );

            $table->index(['product_id', 'is_active']);
            $table->index(['alternative_product_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_alternatives');
    }
};
