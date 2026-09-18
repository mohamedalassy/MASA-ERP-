<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOpportunity;
use App\Services\Sales\OpportunityProjectService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SalesOpportunityController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOpportunity::query()
            ->with([
                'branch:id,code,name,name_en',
                'customer:id,code,name',
                'contact:id,customer_id,name,email,mobile',
                'owner:id,name,email',
                'project:id,project_code,name,current_stage,status,total_value',
            ])
            ->latest('id');

        foreach ([
            'branch_id',
            'customer_id',
            'owner_id',
            'project_id',
        ] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        foreach ([
            'stage',
            'status',
            'priority',
        ] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field)->toString());
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('opportunity_number', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($customer) =>
                        $customer->where('name', 'like', "%{$search}%")
                    );
            });
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function show(SalesOpportunity $opportunity)
    {
        $opportunity->load([
            'branch',
            'customer.contacts',
            'contact',
            'lead',
            'project',
            'owner',
            'creator',
            'activities.owner',
        ]);

        return response()->json([
            'success' => true,
            'data' => $opportunity,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $validated['opportunity_number'] =
            $validated['opportunity_number'] ?? $this->nextOpportunityNumber();

        $validated['created_by'] = $request->user()?->id;
        $validated['last_activity_at'] = now();

        $opportunity = SalesOpportunity::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء Opportunity بنجاح.',
            'data' => $opportunity->fresh([
                'branch',
                'customer',
                'contact',
                'owner',
            ]),
        ], 201);
    }

    public function update(Request $request, SalesOpportunity $opportunity)
    {
        $validated = $this->validatePayload($request, $opportunity);

        $opportunity->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث Opportunity بنجاح.',
            'data' => $opportunity->fresh([
                'branch',
                'customer',
                'contact',
                'owner',
                'project',
            ]),
        ]);
    }

    public function moveStage(Request $request, SalesOpportunity $opportunity)
    {
        $validated = $request->validate([
            'stage' => [
                'required',
                'in:qualification,discovery,site_visit,solution,pricing,quotation,negotiation,won,lost,on_hold',
            ],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'lost_reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $data = [
            'stage' => $validated['stage'],
            'last_activity_at' => now(),
        ];

        if (array_key_exists('probability', $validated)) {
            $data['probability'] = $validated['probability'];
        }

        if ($validated['stage'] === 'won') {
            $data['status'] = 'won';
            $data['probability'] = 100;
            $data['won_at'] = now();
            $data['lost_at'] = null;
            $data['lost_reason'] = null;
        }

        if ($validated['stage'] === 'lost') {
            $data['status'] = 'lost';
            $data['probability'] = 0;
            $data['lost_at'] = now();
            $data['won_at'] = null;
            $data['lost_reason'] = $validated['lost_reason']
                ?? 'Not specified';
        }

        if (!in_array($validated['stage'], ['won', 'lost'], true)) {
            $data['status'] = 'open';
        }

        $opportunity->update($data);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث مرحلة Opportunity.',
            'data' => $opportunity->fresh(),
        ]);
    }

    public function createProject(
        Request $request,
        SalesOpportunity $opportunity,
        OpportunityProjectService $service
    ) {
        $validated = $request->validate([
            'project_code' => [
                'nullable',
                'string',
                'max:100',
                'unique:projects,project_code',
            ],
            'name' => ['nullable', 'string', 'max:255'],
            'project_type' => ['nullable', 'string', 'max:255'],
            'current_stage' => [
                'nullable',
                'in:sales,pricing,purchasing,finance,execution',
            ],
            'expected_start_date' => ['nullable', 'date'],
            'expected_end_date' => ['nullable', 'date'],
        ]);

        $project = $service->createProject(
            $opportunity,
            $validated,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء وربط المشروع من Opportunity بنجاح.',
            'data' => $project,
        ], 201);
    }

    private function validatePayload(
        Request $request,
        ?SalesOpportunity $opportunity = null
    ): array {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'contact_id' => ['nullable', 'integer', 'exists:customer_contacts,id'],
            'lead_id' => ['nullable', 'integer', 'exists:sales_leads,id'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'opportunity_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('sales_opportunities', 'opportunity_number')
                    ->ignore($opportunity?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stage' => [
                'nullable',
                'in:qualification,discovery,site_visit,solution,pricing,quotation,negotiation,won,lost,on_hold',
            ],
            'status' => ['nullable', 'in:open,won,lost,on_hold'],
            'priority' => ['nullable', 'in:low,normal,high,urgent'],
            'source' => ['nullable', 'string', 'max:100'],
            'industry' => ['nullable', 'string', 'max:255'],
            'expected_value' => ['nullable', 'numeric', 'min:0'],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'expected_close_date' => ['nullable', 'date'],
            'next_action_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'lost_reason' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function nextOpportunityNumber(): string
    {
        return 'OP-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }
}
