<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('ai_sales_signals', function (Blueprint $table) {
   $table->id();
   $table->foreignId('company_id')->constrained('ai_sales_companies')->cascadeOnDelete();
   $table->string('type')->index();
   $table->string('title');
   $table->text('description')->nullable();
   $table->unsignedTinyInteger('strength')->default(50);
   $table->unsignedTinyInteger('confidence')->default(0);
   $table->string('source')->nullable();
   $table->string('source_url',2048)->nullable();
   $table->json('evidence')->nullable();
   $table->timestamp('detected_at')->nullable()->index();
   $table->timestamp('expires_at')->nullable();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('ai_sales_signals'); }
};