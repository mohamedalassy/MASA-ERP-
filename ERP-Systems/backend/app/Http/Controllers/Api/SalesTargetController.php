<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesTarget;
use App\Models\SalesOrder;
use Illuminate\Http\Request;

class SalesTargetController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesTarget::query()
            ->with(['branch:id,code,name', 'user:id,name,email'])
            ->latest('period_start');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);
        $validated['created_by'] = $request->user()?->id;

        $target = SalesTarget::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء Target.',
            'data' => $target->fresh(['branch', 'user']),
        ], 201);
    }

    public function performance(Request $request)
    {
        $targets = SalesTarget::query()
            ->with(['user:id,name', 'branch:id,code,name']);

        if ($request->filled('branch_id')) {
            $targets->where('branch_id', $request->integer('branch_id'));
        }

        $rows = $targets->get()->map(function ($target) {
            $actual = (float) SalesOrder::query()
                ->where('branch_id', $target->branch_id)
                ->when($target->user_id, fn ($q) =>
                    $q->whereHas('project', fn ($p) =>
                        $p->where('created_by', $target->user_id)
                    )
                )
                ->whereBetween('order_date', [
                    $target->period_start->toDateString(),
                    $target->period_end->toDateString(),
                ])
                ->whereNotIn('status', ['draft', 'cancelled'])
                ->sum('total');

            return [
                'target' => $target,
                'actual_amount' => round($actual, 2),
                'achievement_percent' => (float) $target->target_amount > 0
                    ? round(($actual / (float) $target->target_amount) * 100, 2)
                    : 0,
                'gap' => round(max(0, (float) $target->target_amount - $actual), 2),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $rows,
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'period_type' => ['required', 'in:monthly,quarterly,yearly,custom'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'target_amount' => ['required', 'numeric', 'min:0'],
            'target_margin' => ['nullable', 'numeric', 'min:0'],
            'target_deals' => ['nullable', 'integer', 'min:0'],
            'status' => ['nullable', 'in:draft,active,closed'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
