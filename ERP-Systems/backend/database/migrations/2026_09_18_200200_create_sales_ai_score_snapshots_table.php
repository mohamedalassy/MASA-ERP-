<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_ai_score_snapshots', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('opportunity_id')
                ->constrained('sales_opportunities')
                ->cascadeOnDelete();

            $table->date('snapshot_date');

            $table->decimal('win_score', 7, 2)->default(0);
            $table->decimal('risk_score', 7, 2)->default(0);
            $table->decimal('engagement_score', 7, 2)->default(0);
            $table->decimal('commercial_score', 7, 2)->default(0);
            $table->decimal('timing_score', 7, 2)->default(0);
            $table->decimal('overall_score', 7, 2)->default(0);

            $table->string('classification', 30);
            $table->json('explanations')->nullable();

            $table->timestamps();

            $table->unique(['opportunity_id', 'snapshot_date']);
            $table->index(['branch_id', 'classification']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_ai_score_snapshots');
    }
};
