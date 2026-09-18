<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('scope_type', 30)->default('global');
            $table->unsignedBigInteger('scope_id')->nullable();

            $table->decimal('minimum_margin_percent', 8, 2)->default(0);
            $table->decimal('target_margin_percent', 8, 2)->default(0);
            $table->decimal('default_markup_percent', 8, 2)->default(0);
            $table->decimal('maximum_discount_percent', 8, 2)->default(0);

            $table->boolean('block_below_minimum_margin')->default(false);
            $table->boolean('require_approval_below_target')->default(false);
            $table->boolean('is_active')->default(true);

            $table->unsignedInteger('priority')->default(100);

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['scope_type', 'scope_id']);
            $table->index(['is_active', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
