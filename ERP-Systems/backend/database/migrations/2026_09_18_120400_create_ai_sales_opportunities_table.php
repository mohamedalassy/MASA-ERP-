<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('ai_sales_opportunities', function (Blueprint $table) {
   $table->id();
   $table->foreignId('company_id')->constrained('ai_sales_companies')->cascadeOnDelete();
   $table->foreignId('lead_id')->nullable()->constrained('ai_sales_leads')->nullOnDelete();
   $table->string('title');
   $table->string('stage')->default('new')->index();
   $table->decimal('value',15,2)->default(0);
   $table->string('currency',3)->default('SAR');
   $table->unsignedTinyInteger('probability')->default(0);
   $table->date('expected_close_date')->nullable()->index();
   $table->json('matched_items')->nullable();
   $table->text('next_best_action')->nullable();
   $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('ai_sales_opportunities'); }
};