<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesActivity;
use App\Models\SalesOpportunity;
use Illuminate\Http\Request;

class SalesActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesActivity::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'lead:id,lead_number,name,company_name',
                'opportunity:id,opportunity_number,name',
                'project:id,project_code,name',
                'owner:id,name,email',
            ])
            ->latest('activity_at');

        foreach ([
            'branch_id',
            'customer_id',
            'lead_id',
            'opportunity_id',
            'project_id',
            'owner_id',
        ] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        foreach ([
            'type',
            'status',
            'priority',
        ] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field)->toString());
            }
        }

        if ($request->boolean('overdue')) {
            $query->where('status', 'pending')
                ->whereNotNull('due_at')
                ->where('due_at', '<', now());
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(300)->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $validated['created_by'] = $request->user()?->id;

        if (empty($validated['activity_at'])) {
            $validated['activity_at'] = now();
        }

        $activity = SalesActivity::create($validated);

        if ($activity->opportunity_id) {
            SalesOpportunity::whereKey($activity->opportunity_id)->update([
                'last_activity_at' => $activity->activity_at,
                'next_action_at' => $activity->next_action_at,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة النشاط بنجاح.',
            'data' => $activity->fresh([
                'customer',
                'lead',
                'opportunity',
                'project',
                'owner',
            ]),
        ], 201);
    }

    public function update(Request $request, SalesActivity $activity)
    {
        $validated = $this->validatePayload($request);

        $activity->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث النشاط.',
            'data' => $activity->fresh(),
        ]);
    }

    public function complete(Request $request, SalesActivity $activity)
    {
        $validated = $request->validate([
            'outcome' => ['nullable', 'string', 'max:5000'],
            'next_action' => ['nullable', 'string', 'max:2000'],
            'next_action_at' => ['nullable', 'date'],
        ]);

        $activity->update([
            'status' => 'completed',
            'completed_at' => now(),
            'outcome' => $validated['outcome'] ?? $activity->outcome,
            'next_action' => $validated['next_action'] ?? null,
            'next_action_at' => $validated['next_action_at'] ?? null,
        ]);

        if ($activity->opportunity_id) {
            SalesOpportunity::whereKey($activity->opportunity_id)->update([
                'last_activity_at' => now(),
                'next_action_at' => $validated['next_action_at'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إكمال النشاط.',
            'data' => $activity->fresh(),
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'lead_id' => ['nullable', 'integer', 'exists:sales_leads,id'],
            'opportunity_id' => ['nullable', 'integer', 'exists:sales_opportunities,id'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'type' => [
                'required',
                'in:call,email,meeting,site_visit,task,whatsapp,note',
            ],
            'subject' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:pending,completed,cancelled'],
            'priority' => ['nullable', 'in:low,normal,high,urgent'],
            'activity_at' => ['nullable', 'date'],
            'due_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'outcome' => ['nullable', 'string', 'max:5000'],
            'next_action' => ['nullable', 'string', 'max:2000'],
            'next_action_at' => ['nullable', 'date'],
        ]);
    }
}
