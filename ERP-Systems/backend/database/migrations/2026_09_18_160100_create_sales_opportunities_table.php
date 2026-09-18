<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_opportunities', function (Blueprint $table) {
            $table->id();

            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->foreignId('contact_id')
                ->nullable()
                ->constrained('customer_contacts')
                ->nullOnDelete();

            $table->foreignId('lead_id')
                ->nullable()
                ->constrained('sales_leads')
                ->nullOnDelete();

            $table->foreignId('project_id')
                ->nullable()
                ->constrained('projects')
                ->nullOnDelete();

            $table->string('opportunity_number', 100)->unique();
            $table->string('name');
            $table->text('description')->nullable();

            $table->string('stage', 40)->default('qualification');
            $table->string('status', 20)->default('open');
            $table->string('priority', 20)->default('normal');

            $table->string('source', 100)->nullable();
            $table->string('industry')->nullable();

            $table->decimal('expected_value', 15, 2)->default(0);
            $table->unsignedTinyInteger('probability')->default(25);

            $table->date('expected_close_date')->nullable();
            $table->timestamp('next_action_at')->nullable();

            $table->foreignId('owner_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('lost_reason')->nullable();
            $table->timestamp('won_at')->nullable();
            $table->timestamp('lost_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['branch_id', 'stage', 'status']);
            $table->index(['owner_id', 'stage']);
            $table->index('expected_close_date');
        });

        Schema::table('sales_leads', function (Blueprint $table) {
            $table->foreign('converted_opportunity_id')
                ->references('id')
                ->on('sales_opportunities')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales_leads', function (Blueprint $table) {
            $table->dropForeign(['converted_opportunity_id']);
        });

        Schema::dropIfExists('sales_opportunities');
    }
};
