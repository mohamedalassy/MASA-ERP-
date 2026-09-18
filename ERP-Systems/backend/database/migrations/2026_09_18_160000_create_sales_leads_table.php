<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_leads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('customers')
                ->nullOnDelete();

            $table->foreignId('contact_id')
                ->nullable()
                ->constrained('customer_contacts')
                ->nullOnDelete();

            $table->string('lead_number', 100)->unique();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('job_title')->nullable();
            $table->string('phone', 100)->nullable();
            $table->string('email')->nullable();

            $table->string('source', 100)->nullable();
            $table->string('status', 30)->default('new');
            $table->string('priority', 20)->default('normal');
            $table->string('industry')->nullable();

            $table->decimal('estimated_value', 15, 2)->default(0);

            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamp('qualified_at')->nullable();
            $table->timestamp('converted_at')->nullable();

            $table->unsignedBigInteger('converted_opportunity_id')->nullable();

            $table->text('disqualification_reason')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'status']);
            $table->index(['owner_id', 'status']);
            $table->index(['source', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_leads');
    }
};
