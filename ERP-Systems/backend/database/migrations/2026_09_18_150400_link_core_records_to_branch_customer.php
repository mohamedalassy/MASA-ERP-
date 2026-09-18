<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Projects
        |--------------------------------------------------------------------------
        */

        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('projects', 'customer_id')) {
                $table->foreignId('customer_id')
                    ->nullable()
                    ->after('branch_id')
                    ->constrained('customers')
                    ->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Project Quotations
        |--------------------------------------------------------------------------
        */

        Schema::table('project_quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('project_quotations', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Purchase Orders
        |--------------------------------------------------------------------------
        */

        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Inventory Transactions
        |--------------------------------------------------------------------------
        */

        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_transactions', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Project Financial Transactions
        |--------------------------------------------------------------------------
        */

        Schema::table('project_financial_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('project_financial_transactions', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Project Expenses
        |--------------------------------------------------------------------------
        */

        Schema::table('project_expenses', function (Blueprint $table) {
            if (!Schema::hasColumn('project_expenses', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Backfill Branch IDs
        |--------------------------------------------------------------------------
        |
        | استخدام correlated subqueries بدل UPDATE ... JOIN
        | حتى يكون الـ migration متوافقًا مع SQLite و MySQL.
        |
        */

        DB::table('project_quotations')
            ->whereNull('branch_id')
            ->whereNotNull('project_id')
            ->update([
                'branch_id' => DB::raw(
                    '(SELECT projects.branch_id
                      FROM projects
                      WHERE projects.id = project_quotations.project_id)'
                ),
            ]);

        DB::table('purchase_orders')
            ->whereNull('branch_id')
            ->whereNotNull('project_id')
            ->update([
                'branch_id' => DB::raw(
                    '(SELECT projects.branch_id
                      FROM projects
                      WHERE projects.id = purchase_orders.project_id)'
                ),
            ]);

        DB::table('inventory_transactions')
            ->whereNull('branch_id')
            ->whereNotNull('project_id')
            ->update([
                'branch_id' => DB::raw(
                    '(SELECT projects.branch_id
                      FROM projects
                      WHERE projects.id = inventory_transactions.project_id)'
                ),
            ]);

        DB::table('project_financial_transactions')
            ->whereNull('branch_id')
            ->whereNotNull('project_id')
            ->update([
                'branch_id' => DB::raw(
                    '(SELECT projects.branch_id
                      FROM projects
                      WHERE projects.id = project_financial_transactions.project_id)'
                ),
            ]);

        DB::table('project_expenses')
            ->whereNull('branch_id')
            ->whereNotNull('project_id')
            ->update([
                'branch_id' => DB::raw(
                    '(SELECT projects.branch_id
                      FROM projects
                      WHERE projects.id = project_expenses.project_id)'
                ),
            ]);
    }

    public function down(): void
    {
        /*
         * Intentionally non-destructive.
         *
         * This migration links existing ERP records to the new
         * branch/customer foundation. We do not remove these columns
         * automatically on rollback to avoid accidental data loss.
         */
    }
};