<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->string('name_en')->nullable();
            $table->string('city')->nullable();
            $table->string('region')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 100)->nullable();
            $table->string('email')->nullable();
            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->boolean('is_head_office')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'city']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
