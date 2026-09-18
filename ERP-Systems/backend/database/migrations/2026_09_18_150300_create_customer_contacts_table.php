<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_contacts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('customer_id')
                ->constrained('customers')
                ->cascadeOnDelete();

            $table->string('name');
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->string('phone', 100)->nullable();
            $table->string('mobile', 100)->nullable();
            $table->string('email')->nullable();

            $table->string('role', 100)->nullable();
            $table->string('influence_level', 20)->default('medium');

            $table->boolean('is_primary')->default(false);
            $table->boolean('is_decision_maker')->default(false);

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'is_primary']);
            $table->index(['customer_id', 'is_decision_maker']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_contacts');
    }
};
