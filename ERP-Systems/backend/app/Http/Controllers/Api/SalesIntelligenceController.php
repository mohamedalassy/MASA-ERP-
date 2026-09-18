<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesDealHealthSnapshot;
use App\Models\SalesForecastSnapshot;
use App\Models\SalesRevenueLeakage;
use App\Services\Sales\SalesIntelligenceService;
use Illuminate\Http\Request;

class SalesIntelligenceController extends Controller
{
    public function forecast(Request $request, SalesIntelligenceService $service)
    {
        return response()->json([
            'success' => true,
            'data' => $service->forecast(
                $request->filled('branch_id')
                    ? $request->integer('branch_id')
                    : null
            ),
        ]);
    }

    public function snapshotForecast(Request $request, SalesIntelligenceService $service)
    {
        $snapshot = $service->snapshotForecast(
            $request->filled('branch_id')
                ? $request->integer('branch_id')
                : null,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'data' => $snapshot,
        ], 201);
    }

    public function forecastHistory(Request $request)
    {
        $query = SalesForecastSnapshot::query()
            ->with('branch:id,code,name')
            ->latest('snapshot_date');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(180)->get(),
        ]);
    }

    public function refreshDealHealth(Request $request, SalesIntelligenceService $service)
    {
        $rows = $service->refreshDealHealth(
            $request->filled('branch_id')
                ? $request->integer('branch_id')
                : null
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function dealHealth(Request $request)
    {
        $query = SalesDealHealthSnapshot::query()
            ->with([
                'branch:id,code,name',
                'opportunity.customer:id,code,name',
                'opportunity.owner:id,name',
            ])
            ->latest('snapshot_date');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function detectLeakage(Request $request, SalesIntelligenceService $service)
    {
        $rows = $service->detectRevenueLeakage(
            $request->filled('branch_id')
                ? $request->integer('branch_id')
                : null
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function leakage(Request $request)
    {
        $query = SalesRevenueLeakage::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'salesOrder:id,order_number',
                'salesInvoice:id,invoice_number',
                'contract:id,contract_number',
                'quotation:id,quotation_number',
            ])
            ->latest('detected_at');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function resolveLeakage(Request $request, SalesRevenueLeakage $leakage)
    {
        $validated = $request->validate([
            'resolution_notes' => ['nullable', 'string'],
        ]);

        $leakage->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolution_notes' => $validated['resolution_notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إغلاق حالة Revenue Leakage.',
            'data' => $leakage->fresh(),
        ]);
    }

    public function profitability(Request $request, SalesIntelligenceService $service)
    {
        return response()->json([
            'success' => true,
            'data' => $service->customerProfitability(
                $request->filled('branch_id')
                    ? $request->integer('branch_id')
                    : null
            ),
        ]);
    }
}
