<?php

namespace App\Services\Sales;

use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\SalesLead;
use App\Models\SalesOpportunity;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeadConversionService
{
    public function convert(
        SalesLead $lead,
        array $payload = [],
        ?int $actorId = null
    ): SalesOpportunity {
        if ($lead->status === 'converted' && $lead->convertedOpportunity) {
            return $lead->convertedOpportunity;
        }

        if ($lead->status === 'disqualified') {
            throw ValidationException::withMessages([
                'lead' => 'لا يمكن تحويل Lead مستبعدة إلى Opportunity.',
            ]);
        }

        return DB::transaction(function () use ($lead, $payload, $actorId) {
            $customer = $lead->customer;

            if (!$customer) {
                $customer = Customer::create([
                    'branch_id' => $lead->branch_id,
                    'code' => $this->nextCustomerCode(),
                    'name' => $lead->company_name ?: $lead->name,
                    'type' => 'company',
                    'industry' => $lead->industry,
                    'phone' => $lead->phone,
                    'email' => $lead->email,
                    'status' => 'active',
                    'owner_id' => $lead->owner_id,
                    'created_by' => $actorId,
                    'notes' => 'تم إنشاؤه تلقائيًا من Lead ' . $lead->lead_number,
                ]);
            }

            $contact = $lead->contact;

            if (!$contact && $lead->name) {
                $contact = CustomerContact::create([
                    'customer_id' => $customer->id,
                    'name' => $lead->name,
                    'job_title' => $lead->job_title,
                    'phone' => $lead->phone,
                    'mobile' => $lead->phone,
                    'email' => $lead->email,
                    'role' => 'lead_contact',
                    'influence_level' => 'medium',
                    'is_primary' => true,
                    'is_decision_maker' => false,
                ]);
            }

            $opportunity = SalesOpportunity::create([
                'branch_id' => $lead->branch_id,
                'customer_id' => $customer->id,
                'contact_id' => $contact?->id,
                'lead_id' => $lead->id,
                'opportunity_number' => $this->nextOpportunityNumber(),
                'name' => $payload['name']
                    ?? ($lead->company_name
                        ? "Opportunity - {$lead->company_name}"
                        : "Opportunity - {$lead->name}"),
                'description' => $payload['description'] ?? $lead->notes,
                'stage' => $payload['stage'] ?? 'qualification',
                'status' => 'open',
                'priority' => $payload['priority'] ?? $lead->priority ?? 'normal',
                'source' => $lead->source,
                'industry' => $lead->industry,
                'expected_value' => $payload['expected_value']
                    ?? $lead->estimated_value
                    ?? 0,
                'probability' => $payload['probability'] ?? 25,
                'expected_close_date' => $payload['expected_close_date'] ?? null,
                'owner_id' => $payload['owner_id'] ?? $lead->owner_id,
                'created_by' => $actorId,
                'last_activity_at' => now(),
                'notes' => $payload['notes'] ?? null,
            ]);

            $lead->update([
                'customer_id' => $customer->id,
                'contact_id' => $contact?->id,
                'status' => 'converted',
                'qualified_at' => $lead->qualified_at ?: now(),
                'converted_at' => now(),
                'converted_opportunity_id' => $opportunity->id,
            ]);

            return $opportunity->fresh([
                'branch',
                'customer',
                'contact',
                'owner',
                'lead',
            ]);
        });
    }

    private function nextCustomerCode(): string
    {
        return 'CUS-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }

    private function nextOpportunityNumber(): string
    {
        return 'OP-' . now()->format('ymdHis') . '-' . random_int(100, 999);
    }
}
