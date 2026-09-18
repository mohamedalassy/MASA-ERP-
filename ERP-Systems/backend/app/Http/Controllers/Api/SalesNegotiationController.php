<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesNegotiation;
use Illuminate\Http\Request;

class SalesNegotiationController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesNegotiation::query()
            ->with([
                'branch:id,code,name',
                'opportunity:id,opportunity_number,name',
                'quotation:id,quotation_number,version,status,total',
                'customer:id,code,name',
                'requester:id,name',
                'approver:id,name',
            ])
            ->latest('id');

        foreach (['branch_id', 'opportunity_id', 'quotation_id', 'customer_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);
        $validated['requested_by'] = $request->user()?->id;
        $validated['requested_at'] = now();

        $negotiation = SalesNegotiation::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء سجل تفاوض بنجاح.',
            'data' => $negotiation->fresh([
                'opportunity',
                'quotation',
                'customer',
                'requester',
            ]),
        ], 201);
    }

    public function update(Request $request, SalesNegotiation $negotiation)
    {
        $validated = $this->validatePayload($request);
        $negotiation->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث سجل التفاوض.',
            'data' => $negotiation->fresh(),
        ]);
    }

    public function approve(Request $request, SalesNegotiation $negotiation)
    {
        $validated = $request->validate([
            'approved_value' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $negotiation->update([
            'status' => 'approved',
            'approved_value' => $validated['approved_value']
                ?? $negotiation->requested_value,
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
            'notes' => $validated['notes'] ?? $negotiation->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم اعتماد بند التفاوض.',
            'data' => $negotiation->fresh(['approver']),
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'opportunity_id' => ['nullable', 'integer', 'exists:sales_opportunities,id'],
            'quotation_id' => ['nullable', 'integer', 'exists:project_quotations,id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'type' => [
                'required',
                'in:discount,payment_terms,delivery,warranty,scope,commercial,technical,other',
            ],
            'subject' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
            'requested_value' => ['nullable', 'numeric', 'min:0'],
            'approved_value' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:open,pending,approved,rejected,closed'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
