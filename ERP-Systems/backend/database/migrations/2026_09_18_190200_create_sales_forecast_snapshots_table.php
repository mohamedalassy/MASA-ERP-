<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_forecast_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->date('snapshot_date');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('committed_value', 15, 2)->default(0);
            $table->decimal('likely_value', 15, 2)->default(0);
            $table->decimal('upside_value', 15, 2)->default(0);
            $table->decimal('pipeline_value', 15, 2)->default(0);
            $table->decimal('weighted_pipeline', 15, 2)->default(0);
            $table->decimal('target_value', 15, 2)->default(0);
            $table->decimal('coverage_ratio', 10, 4)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['branch_id', 'snapshot_date', 'period_start', 'period_end'], 'sales_forecast_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_forecast_snapshots');
    }
};
