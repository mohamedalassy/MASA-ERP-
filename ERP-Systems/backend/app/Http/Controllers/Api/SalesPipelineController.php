<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesLead;
use App\Models\SalesOpportunity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesPipelineController extends Controller
{
    public function summary(Request $request)
    {
        $branchId = $request->filled('branch_id')
            ? $request->integer('branch_id')
            : null;

        $base = SalesOpportunity::query()
            ->where('status', 'open');

        if ($branchId) {
            $base->where('branch_id', $branchId);
        }

        $stageRows = (clone $base)
            ->select([
                'stage',
                DB::raw('COUNT(*) as deals'),
                DB::raw('COALESCE(SUM(expected_value), 0) as value'),
                DB::raw('COALESCE(SUM(expected_value * probability / 100), 0) as weighted_value'),
            ])
            ->groupBy('stage')
            ->get()
            ->keyBy('stage');

        $stages = [
            'qualification',
            'discovery',
            'site_visit',
            'solution',
            'pricing',
            'quotation',
            'negotiation',
        ];

        $pipeline = collect($stages)->map(function ($stage) use ($stageRows) {
            $row = $stageRows->get($stage);

            return [
                'stage' => $stage,
                'deals' => (int) ($row->deals ?? 0),
                'value' => (float) ($row->value ?? 0),
                'weighted_value' => (float) ($row->weighted_value ?? 0),
            ];
        });

        $leadQuery = SalesLead::query()
            ->whereNotIn('status', ['converted', 'disqualified']);

        if ($branchId) {
            $leadQuery->where('branch_id', $branchId);
        }

        $wonQuery = SalesOpportunity::query()
            ->where('status', 'won');

        $lostQuery = SalesOpportunity::query()
            ->where('status', 'lost');

        if ($branchId) {
            $wonQuery->where('branch_id', $branchId);
            $lostQuery->where('branch_id', $branchId);
        }

        $won = $wonQuery->count();
        $lost = $lostQuery->count();

        return response()->json([
            'success' => true,
            'data' => [
                'open_leads' => $leadQuery->count(),
                'pipeline' => $pipeline,
                'pipeline_value' => (float) $base->sum('expected_value'),
                'weighted_pipeline' => (float) $base->get()
                    ->sum(fn ($item) =>
                        (float) $item->expected_value
                        * ((int) $item->probability / 100)
                    ),
                'won_count' => $won,
                'lost_count' => $lost,
                'win_rate' => ($won + $lost) > 0
                    ? round(($won / ($won + $lost)) * 100, 2)
                    : 0,
            ],
        ]);
    }
}
