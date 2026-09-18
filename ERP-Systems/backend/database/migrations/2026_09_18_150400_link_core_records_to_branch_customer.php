<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

        Schema::table('project_quotations', function (Blueprint $table) {
            if (!Schema::hasColumn('project_quotations', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_transactions', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

        Schema::table('project_financial_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('project_financial_transactions', 'branch_id')) {
                $table->foreignId('branch_id')
                    ->nullable()
                    ->after('project_id')
                    ->constrained('branches')
                    ->nullOnDelete();
            }
        });

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
         * Backfill branch_id from the parent project wherever possible.
         * Existing rows remain safe because the columns are nullable.
         */
        DB::statement('
            UPDATE project_quotations pq
            JOIN projects p ON p.id = pq.project_id
            SET pq.branch_id = p.branch_id
            WHERE pq.branch_id IS NULL
        ');

        DB::statement('
            UPDATE purchase_orders po
            JOIN projects p ON p.id = po.project_id
            SET po.branch_id = p.branch_id
            WHERE po.branch_id IS NULL
        ');

        DB::statement('
            UPDATE inventory_transactions it
            JOIN projects p ON p.id = it.project_id
            SET it.branch_id = p.branch_id
            WHERE it.branch_id IS NULL
              AND it.project_id IS NOT NULL
        ');

        DB::statement('
            UPDATE project_financial_transactions ft
            JOIN projects p ON p.id = ft.project_id
            SET ft.branch_id = p.branch_id
            WHERE ft.branch_id IS NULL
        ');

        DB::statement('
            UPDATE project_expenses pe
            JOIN projects p ON p.id = pe.project_id
            SET pe.branch_id = p.branch_id
            WHERE pe.branch_id IS NULL
        ');
    }

    public function down(): void
    {
        // Non-destructive foundation migration.
    }
};
