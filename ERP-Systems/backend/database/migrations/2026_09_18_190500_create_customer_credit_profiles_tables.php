<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_credit_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('customer_id')->unique()->constrained('customers')->cascadeOnDelete();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->decimal('used_credit', 15, 2)->default(0);
            $table->decimal('available_credit', 15, 2)->default(0);
            $table->decimal('overdue_amount', 15, 2)->default(0);
            $table->unsignedInteger('average_delay_days')->default(0);
            $table->string('risk_status', 30)->default('low');
            $table->boolean('is_blocked')->default(false);
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('customer_credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_credit_profile_id')
                ->constrained('customer_credit_profiles')
                ->cascadeOnDelete();
            $table->string('type', 50);
            $table->string('reference_type', 100)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('balance_after', 15, 2)->default(0);
            $table->date('transaction_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_credit_profile_id', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_credit_transactions');
        Schema::dropIfExists('customer_credit_profiles');
    }
};
