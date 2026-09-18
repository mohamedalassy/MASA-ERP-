<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\SalesAiAction;
use App\Models\SalesAiInsight;
use App\Models\SalesAiRecommendation;
use App\Models\SalesAiScoreSnapshot;
use App\Models\SalesOpportunity;
use App\Services\SalesAI\CrossSellRecommendationService;
use App\Services\SalesAI\NextBestActionService;
use App\Services\SalesAI\OpportunityScoringService;
use Illuminate\Http\Request;

class SalesAiController extends Controller
{
    public function insights(Request $request)
    {
        $query = SalesAiInsight::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'opportunity:id,opportunity_number,name,stage,status,probability',
                'resolver:id,name',
            ])
            ->latest('generated_at');

        foreach (['branch_id', 'customer_id', 'opportunity_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        foreach (['status', 'severity', 'insight_type'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field)->toString());
            }
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(300)->get(),
        ]);
    }

    public function resolveInsight(Request $request, SalesAiInsight $insight)
    {
        $validated = $request->validate([
            'resolution_notes' => ['nullable', 'string'],
        ]);

        $insight->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $request->user()?->id,
            'resolution_notes' => $validated['resolution_notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إغلاق AI Insight.',
            'data' => $insight->fresh(['resolver']),
        ]);
    }

    public function scoreOpportunity(
        SalesOpportunity $opportunity,
        OpportunityScoringService $service
    ) {
        $score = $service->score($opportunity);

        return response()->json([
            'success' => true,
            'data' => $score->load('opportunity.customer'),
        ]);
    }

    public function scoreAll(Request $request, OpportunityScoringService $service)
    {
        $query = SalesOpportunity::query()
            ->where('status', 'open');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        $rows = $query->get()->map(
            fn ($opportunity) => $service->score($opportunity)
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function scoreHistory(SalesOpportunity $opportunity)
    {
        return response()->json([
            'success' => true,
            'data' => SalesAiScoreSnapshot::query()
                ->where('opportunity_id', $opportunity->id)
                ->orderBy('snapshot_date')
                ->get(),
        ]);
    }

    public function nextBestAction(
        SalesOpportunity $opportunity,
        NextBestActionService $service
    ) {
        $action = $service->generate($opportunity);

        return response()->json([
            'success' => true,
            'data' => $action->load(['assignee', 'insight']),
        ], 201);
    }

    public function actions(Request $request)
    {
        $query = SalesAiAction::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'opportunity:id,opportunity_number,name,stage',
                'assignee:id,name,email',
                'insight:id,title,severity,score',
            ])
            ->latest('id');

        foreach (['branch_id', 'assigned_to', 'opportunity_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(300)->get(),
        ]);
    }

    public function completeAction(
        Request $request,
        SalesAiAction $action,
        NextBestActionService $service
    ) {
        $validated = $request->validate([
            'outcome' => ['nullable', 'string'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إكمال AI Action.',
            'data' => $service->complete(
                $action,
                $validated['outcome'] ?? null
            ),
        ]);
    }

    public function generateCrossSell(
        Request $request,
        Customer $customer,
        CrossSellRecommendationService $service
    ) {
        $rows = $service->generateForCustomer(
            $customer->id,
            $request->filled('branch_id')
                ? $request->integer('branch_id')
                : $customer->branch_id
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function recommendations(Request $request)
    {
        $query = SalesAiRecommendation::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'opportunity:id,opportunity_number,name',
                'sourceProduct:id,sku,name,category',
                'recommendedProduct:id,sku,name,category,default_sale_price',
            ])
            ->latest('generated_at');

        foreach (['branch_id', 'customer_id', 'opportunity_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(300)->get(),
        ]);
    }

    public function acceptRecommendation(SalesAiRecommendation $recommendation)
    {
        $recommendation->update([
            'status' => 'accepted',
            'accepted_at' => now(),
            'rejected_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $recommendation->fresh(),
        ]);
    }

    public function rejectRecommendation(SalesAiRecommendation $recommendation)
    {
        $recommendation->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'accepted_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $recommendation->fresh(),
        ]);
    }
}
