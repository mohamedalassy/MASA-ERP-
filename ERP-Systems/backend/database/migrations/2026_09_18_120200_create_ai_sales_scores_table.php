<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('ai_sales_scores', function (Blueprint $table) {
   $table->id();
   $table->foreignId('company_id')->constrained('ai_sales_companies')->cascadeOnDelete();
   $table->unsignedTinyInteger('fit_score')->default(0);
   $table->unsignedTinyInteger('intent_score')->default(0);
   $table->unsignedTinyInteger('timing_score')->default(0);
   $table->unsignedTinyInteger('confidence_score')->default(0);
   $table->unsignedTinyInteger('overall_score')->default(0)->index();
   $table->json('service_matches')->nullable();
   $table->json('reasons')->nullable();
   $table->string('model_version')->nullable();
   $table->timestamp('scored_at')->nullable()->index();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('ai_sales_scores'); }
};