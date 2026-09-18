<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SalesSystemHealthController extends Controller
{
    public function __invoke()
    {
        $requiredTables = [
            'branches',
            'customers',
            'customer_contacts',
            'sales_leads',
            'sales_opportunities',
            'sales_activities',
            'sales_negotiations',
            'sales_orders',
            'sales_order_items',
            'sales_contracts',
            'sales_deliveries',
            'sales_invoices',
            'sales_payments',
            'sales_targets',
            'sales_commissions',
            'sales_forecast_snapshots',
            'sales_deal_health_snapshots',
            'sales_revenue_leakages',
            'customer_credit_profiles',
            'sales_renewals',
            'sales_ai_insights',
            'sales_ai_actions',
            'sales_ai_score_snapshots',
            'sales_ai_recommendations',
            'branch_product_stocks',
        ];

        $tables = collect($requiredTables)->mapWithKeys(
            fn ($table) => [$table => Schema::hasTable($table)]
        );

        return response()->json([
            'success' => $tables->every(fn ($exists) => $exists),
            'database' => DB::connection()->getDatabaseName(),
            'tables' => $tables,
            'missing' => $tables->filter(fn ($exists) => !$exists)->keys()->values(),
        ]);
    }
}
