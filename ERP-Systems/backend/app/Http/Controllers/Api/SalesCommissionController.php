<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesCommission;
use App\Services\Sales\SalesCommissionService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SalesCommissionController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesCommission::query()
            ->with([
                'branch:id,code,name',
                'user:id,name,email',
                'salesOrder:id,order_number,total',
                'salesInvoice:id,invoice_number,total,paid_amount',
                'approver:id,name',
            ])
            ->latest('id');

        foreach (['branch_id', 'user_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function generate(
        Request $request,
        SalesCommissionService $service
    ) {
        $validated = $request->validate([
            'from' => ['required', 'date'],
            'to' => ['required', 'date', 'after_or_equal:from'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $rows = $service->generate(
            Carbon::parse($validated['from']),
            Carbon::parse($validated['to']),
            $validated['branch_id'] ?? null,
            (float) ($validated['rate'] ?? 2.5)
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function approve(Request $request, SalesCommission $commission)
    {
        $commission->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم اعتماد العمولة.',
            'data' => $commission->fresh(['approver']),
        ]);
    }
}
