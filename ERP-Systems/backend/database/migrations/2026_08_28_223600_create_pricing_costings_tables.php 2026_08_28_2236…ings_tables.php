<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_costings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->unsignedBigInteger('quotation_id')->nullable()->index();

            $table->string('title')->default('Project Costing');
            $table->string('currency', 10)->default('SAR');

            $table->decimal('material_cost', 18, 2)->default(0);
            $table->decimal('minimum_margin_percent', 8, 4)->default(15);
            $table->decimal('target_margin_percent', 8, 4)->default(25);
            $table->decimal('tax_rate', 8, 4)->default(15);

            $table->string('status', 30)->default('draft');
            $table->text('notes')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'status']);
        });

        Schema::create('pricing_costing_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pricing_costing_id')
                ->constrained('pricing_costings')
                ->cascadeOnDelete();

            $table->string('type', 50);
            $table->string('label');
            $table->string('calculation_mode', 20)->default('fixed');
            $table->string('percentage_basis', 30)->default('materials');

            $table->decimal('fixed_amount', 18, 2)->default(0);
            $table->decimal('percentage', 10, 4)->default(0);

            $table->unsignedInteger('sort_order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['pricing_costing_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_costing_components');
        Schema::dropIfExists('pricing_costings');
    }
};
