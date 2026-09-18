<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_expenses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('project_id')
                ->constrained('projects')
                ->cascadeOnDelete();

            $table->string('type', 100);

            $table->decimal('amount', 15, 2);

            $table->text('description')->nullable();

            $table->date('expense_date')->nullable();

            $table->string('reference')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamps();

            $table->index(['project_id', 'type']);
            $table->index('expense_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_expenses');
    }
};