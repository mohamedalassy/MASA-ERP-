<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_renewals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('sales_contract_id')->constrained('sales_contracts')->cascadeOnDelete();
            $table->foreignId('opportunity_id')->nullable()->constrained('sales_opportunities')->nullOnDelete();
            $table->string('renewal_number', 120);
            $table->string('status', 30)->default('open');
            $table->decimal('renewal_value', 15, 2)->default(0);
            $table->date('expiry_date');
            $table->date('reminder_date')->nullable();
            $table->unsignedTinyInteger('probability')->default(60);
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('converted_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['sales_contract_id', 'expiry_date']);
            $table->index(['branch_id', 'status', 'expiry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_renewals');
    }
};
