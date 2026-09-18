<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerCreditProfile;
use App\Services\Sales\SalesIntelligenceService;
use Illuminate\Http\Request;

class CustomerCreditController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomerCreditProfile::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name,credit_limit',
                'reviewer:id,name',
            ])
            ->latest('id');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('risk_status')) {
            $query->where('risk_status', $request->string('risk_status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function refresh(Request $request, SalesIntelligenceService $service)
    {
        $rows = $service->refreshCreditProfiles(
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

    public function update(Request $request, CustomerCreditProfile $profile)
    {
        $validated = $request->validate([
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'risk_status' => ['nullable', 'in:low,medium,high'],
            'is_blocked' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $validated['reviewed_by'] = $request->user()?->id;
        $validated['reviewed_at'] = now();

        $profile->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث Credit Profile.',
            'data' => $profile->fresh(['customer', 'reviewer']),
        ]);
    }
}
