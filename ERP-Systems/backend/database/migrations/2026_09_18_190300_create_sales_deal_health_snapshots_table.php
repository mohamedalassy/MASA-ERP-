<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_deal_health_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('opportunity_id')->constrained('sales_opportunities')->cascadeOnDelete();
            $table->date('snapshot_date');
            $table->unsignedTinyInteger('score')->default(0);
            $table->string('health', 30);
            $table->string('risk_level', 30);
            $table->unsignedInteger('days_since_activity')->default(0);
            $table->unsignedInteger('stage_age_days')->default(0);
            $table->boolean('margin_risk')->default(false);
            $table->boolean('activity_risk')->default(false);
            $table->boolean('close_date_risk')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['opportunity_id', 'snapshot_date']);
            $table->index(['branch_id', 'health']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_deal_health_snapshots');
    }
};
