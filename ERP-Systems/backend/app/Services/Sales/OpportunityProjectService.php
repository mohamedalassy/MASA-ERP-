<?php

namespace App\Services\Sales;

use App\Models\Project;
use App\Models\SalesOpportunity;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OpportunityProjectService
{
    public function createProject(
        SalesOpportunity $opportunity,
        array $payload = [],
        ?int $actorId = null
    ): Project {
        if ($opportunity->project) {
            return $opportunity->project;
        }

        if ($opportunity->status === 'lost') {
            throw ValidationException::withMessages([
                'opportunity' => 'لا يمكن إنشاء مشروع من Opportunity خاسرة.',
            ]);
        }

        return DB::transaction(function () use (
            $opportunity,
            $payload,
            $actorId
        ) {
            $customer = $opportunity->customer;

            $project = Project::create([
                'branch_id' => $opportunity->branch_id,
                'customer_id' => $opportunity->customer_id,
                'project_code' => $payload['project_code']
                    ?? $this->nextProjectCode(),
                'name' => $payload['name'] ?? $opportunity->name,
                'customer_name' => $customer?->name ?? 'Customer',
                'customer_code' => $customer?->code,
                'phone' => $customer?->phone,
                'email' => $customer?->email,
                'address' => $customer?->address,
                'commercial_register' => $customer?->commercial_register,
                'tax_number' => $customer?->tax_number,
                'account_manager' => $opportunity->owner?->name,
                'current_stage' => $payload['current_stage'] ?? 'pricing',
                'status' => 'active',
                'project_type' => $payload['project_type'] ?? 'sales_project',
                'priority' => $opportunity->priority ?? 'normal',
                'expected_start_date' => $payload['expected_start_date'] ?? null,
                'expected_end_date' => $payload['expected_end_date']
                    ?? $opportunity->expected_close_date,
                'total_value' => $opportunity->expected_value ?? 0,
                'created_by' => $actorId,
            ]);

            $opportunity->update([
                'project_id' => $project->id,
                'stage' => 'pricing',
                'last_activity_at' => now(),
            ]);

            return $project->fresh([
                'branch',
                'customer',
                'creator',
            ]);
        });
    }

    private function nextProjectCode(): string
    {
        return 'PRJ-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }
}
