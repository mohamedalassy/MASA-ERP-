<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
 public function up(): void {
  Schema::create('ai_sales_leads', function (Blueprint $table) {
   $table->id();
   $table->foreignId('company_id')->constrained('ai_sales_companies')->cascadeOnDelete();
   $table->string('status')->default('new')->index();
   $table->string('priority')->default('medium')->index();
   $table->string('contact_name')->nullable();
   $table->string('contact_title')->nullable();
   $table->string('email')->nullable();
   $table->string('phone')->nullable();
   $table->text('notes')->nullable();
   $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
   $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
   $table->timestamp('approved_at')->nullable();
   $table->timestamps();
  });
 }
 public function down(): void { Schema::dropIfExists('ai_sales_leads'); }
};