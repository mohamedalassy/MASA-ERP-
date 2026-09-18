<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_approval_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained('project_quotations')->cascadeOnDelete();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('action', 40);
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50)->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('acted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acted_at')->nullable();
            $table->json('snapshot')->nullable();
            $table->timestamps();

            $table->index(['quotation_id', 'acted_at']);
            $table->index(['project_id', 'action']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_approval_histories');
    }
};
