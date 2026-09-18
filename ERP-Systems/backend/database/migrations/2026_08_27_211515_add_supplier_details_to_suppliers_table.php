<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {

            $table->string('supplier_code')
                ->nullable()
                ->unique()
                ->after('id');

            $table->string('name')
                ->after('supplier_code');

            $table->string('contact_person')
                ->nullable()
                ->after('name');

            $table->string('phone')
                ->nullable()
                ->after('contact_person');

            $table->string('email')
                ->nullable()
                ->after('phone');

            $table->text('address')
                ->nullable()
                ->after('email');

            $table->string('commercial_register')
                ->nullable()
                ->after('address');

            $table->string('tax_number')
                ->nullable()
                ->after('commercial_register');

            $table->string('payment_terms')
                ->nullable()
                ->after('tax_number');

            $table->unsignedInteger('credit_days')
                ->default(0)
                ->after('payment_terms');

            $table->decimal('credit_limit', 15, 2)
                ->default(0)
                ->after('credit_days');

            $table->boolean('is_active')
                ->default(true)
                ->after('credit_limit');

            $table->text('notes')
                ->nullable()
                ->after('is_active');

            $table->foreignId('created_by')
                ->nullable()
                ->after('notes')
                ->constrained('users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {

            $table->dropForeign(['created_by']);

            $table->dropColumn([
                'supplier_code',
                'name',
                'contact_person',
                'phone',
                'email',
                'address',
                'commercial_register',
                'tax_number',
                'payment_terms',
                'credit_days',
                'credit_limit',
                'is_active',
                'notes',
                'created_by',
            ]);
        });
    }
};