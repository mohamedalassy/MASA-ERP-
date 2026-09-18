<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_quotation_items', function (Blueprint $table) {
            if (!Schema::hasColumn('project_quotation_items', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable()->after('product_id')
                    ->constrained('suppliers')->nullOnDelete();
            }

            if (!Schema::hasColumn('project_quotation_items', 'supplier_price_id')) {
                $table->foreignId('supplier_price_id')->nullable()->after('supplier_id')
                    ->constrained('supplier_prices')->nullOnDelete();
            }

            if (!Schema::hasColumn('project_quotation_items', 'supplier_name_snapshot')) {
                $table->string('supplier_name_snapshot')->nullable()->after('supplier_price_id');
            }

            if (!Schema::hasColumn('project_quotation_items', 'supplier_cost_snapshot')) {
                $table->decimal('supplier_cost_snapshot', 14, 2)->nullable()->after('supplier_name_snapshot');
            }

            if (!Schema::hasColumn('project_quotation_items', 'supplier_lead_time_snapshot')) {
                $table->unsignedInteger('supplier_lead_time_snapshot')->nullable()->after('supplier_cost_snapshot');
            }

            if (!Schema::hasColumn('project_quotation_items', 'supplier_valid_until_snapshot')) {
                $table->date('supplier_valid_until_snapshot')->nullable()->after('supplier_lead_time_snapshot');
            }
        });
    }

    public function down(): void
    {
        Schema::table('project_quotation_items', function (Blueprint $table) {
            foreach ([
                'supplier_valid_until_snapshot',
                'supplier_lead_time_snapshot',
                'supplier_cost_snapshot',
                'supplier_name_snapshot',
                'supplier_price_id',
                'supplier_id',
            ] as $column) {
                if (Schema::hasColumn('project_quotation_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
