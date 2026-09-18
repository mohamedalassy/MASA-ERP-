<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();

            $table->string('code', 50)->unique();
            $table->string('name');
            $table->string('name_en')->nullable();

            $table->string('type', 30)->default('company');
            $table->string('industry')->nullable();

            $table->string('phone', 100)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();

            $table->string('commercial_register')->nullable();
            $table->string('tax_number')->nullable();

            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->unsignedInteger('payment_terms_days')->default(0);

            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('region')->nullable();
            $table->string('country')->default('Saudi Arabia');

            $table->string('status', 30)->default('active');

            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index('name');
            $table->index('commercial_register');
            $table->index('tax_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
