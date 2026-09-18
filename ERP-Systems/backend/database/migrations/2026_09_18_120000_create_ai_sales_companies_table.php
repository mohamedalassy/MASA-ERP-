<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('ai_sales_companies', function (Blueprint $table) {
   $table->id();
   $table->string('name');
   $table->string('legal_name')->nullable();
   $table->string('industry')->nullable()->index();
   $table->string('website')->nullable();
   $table->string('country')->nullable()->index();
   $table->string('region')->nullable()->index();
   $table->string('city')->nullable()->index();
   $table->string('company_size')->nullable();
   $table->string('source')->nullable()->index();
   $table->string('source_url', 2048)->nullable();
   $table->string('status')->default('discovered')->index();
   $table->unsignedTinyInteger('data_confidence')->default(0);
   $table->json('enrichment')->nullable();
   $table->timestamp('discovered_at')->nullable()->index();
   $table->timestamp('last_enriched_at')->nullable();
   $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
   $table->timestamps();
   $table->softDeletes();
   $table->unique(['name','website']);
  });
 }
 public function down(): void { Schema::dropIfExists('ai_sales_companies'); }
};