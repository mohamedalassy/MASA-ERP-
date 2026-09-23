<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cost_centers')) {
            Schema::create('cost_centers', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('parent_id')->nullable()->constrained('cost_centers')->nullOnDelete();
                $table->boolean('is_active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->index('is_active');
            });
        }

        if (Schema::hasTable('supplier_invoice_payments')) {
            if (!Schema::hasColumn('supplier_invoice_payments', 'finance_account_id')) {
                Schema::table('supplier_invoice_payments', function (Blueprint $table) {
                    $table->foreignId('finance_account_id')->nullable()
                        ->constrained('finance_accounts')->nullOnDelete();
                });
            }

            if (!Schema::hasColumn('supplier_invoice_payments', 'finance_journal_entry_id')) {
                Schema::table('supplier_invoice_payments', function (Blueprint $table) {
                    $table->foreignId('finance_journal_entry_id')->nullable()
                        ->constrained('finance_journal_entries')->nullOnDelete();
                });
            }
        }

        if (Schema::hasTable('finance_accounts')) {
            if (!Schema::hasColumn('finance_accounts', 'is_cash_account')) {
                Schema::table('finance_accounts', function (Blueprint $table) {
                    $table->boolean('is_cash_account')->default(false);
                });
            }

            if (!Schema::hasColumn('finance_accounts', 'cash_flow_category')) {
                Schema::table('finance_accounts', function (Blueprint $table) {
                    $table->string('cash_flow_category', 30)->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        // Intentionally non-destructive compatibility migration.
    }
};
