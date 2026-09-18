<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesLead;
use App\Services\Sales\LeadConversionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SalesLeadController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesLead::query()
            ->with([
                'branch:id,code,name,name_en',
                'customer:id,code,name',
                'contact:id,customer_id,name,email,mobile',
                'owner:id,name,email',
                'convertedOpportunity:id,opportunity_number,name,stage,status',
            ])
            ->latest('id');

        foreach ([
            'branch_id',
            'customer_id',
            'owner_id',
        ] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        foreach ([
            'status',
            'priority',
            'source',
        ] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field)->toString());
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('lead_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function show(SalesLead $lead)
    {
        $lead->load([
            'branch',
            'customer',
            'contact',
            'owner',
            'creator',
            'convertedOpportunity',
            'activities.owner',
        ]);

        return response()->json([
            'success' => true,
            'data' => $lead,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $validated['lead_number'] = $validated['lead_number']
            ?? $this->nextLeadNumber();

        $validated['created_by'] = $request->user()?->id;

        $lead = SalesLead::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء Lead بنجاح.',
            'data' => $lead->fresh(['branch', 'owner']),
        ], 201);
    }

    public function update(Request $request, SalesLead $lead)
    {
        $validated = $this->validatePayload($request, $lead);

        if (($validated['status'] ?? null) === 'qualified' && !$lead->qualified_at) {
            $validated['qualified_at'] = now();
        }

        $lead->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث Lead بنجاح.',
            'data' => $lead->fresh(['branch', 'customer', 'contact', 'owner']),
        ]);
    }

    public function convert(
        Request $request,
        SalesLead $lead,
        LeadConversionService $service
    ) {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => [
                'nullable',
                'in:qualification,discovery,site_visit,solution,pricing,quotation,negotiation',
            ],
            'priority' => ['nullable', 'in:low,normal,high,urgent'],
            'expected_value' => ['nullable', 'numeric', 'min:0'],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'expected_close_date' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $opportunity = $service->convert(
            $lead,
            $validated,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحويل Lead إلى Opportunity بنجاح.',
            'data' => $opportunity,
        ], 201);
    }

    public function disqualify(Request $request, SalesLead $lead)
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:2000'],
        ]);

        $lead->update([
            'status' => 'disqualified',
            'disqualification_reason' => $validated['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم استبعاد Lead.',
            'data' => $lead->fresh(),
        ]);
    }

    private function validatePayload(
        Request $request,
        ?SalesLead $lead = null
    ): array {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'contact_id' => ['nullable', 'integer', 'exists:customer_contacts,id'],
            'lead_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('sales_leads', 'lead_number')->ignore($lead?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'source' => ['nullable', 'string', 'max:100'],
            'status' => [
                'nullable',
                'in:new,contacted,qualified,disqualified,converted',
            ],
            'priority' => ['nullable', 'in:low,normal,high,urgent'],
            'industry' => ['nullable', 'string', 'max:255'],
            'estimated_value' => ['nullable', 'numeric', 'min:0'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function nextLeadNumber(): string
    {
        return 'LD-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }
}
