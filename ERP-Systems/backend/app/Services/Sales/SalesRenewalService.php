<?php

namespace App\Services\Sales;

use App\Models\SalesContract;
use App\Models\SalesOpportunity;
use App\Models\SalesRenewal;
use Illuminate\Support\Collection;

class SalesRenewalService
{
    public function generate(?int $branchId = null): Collection
    {
        $query = SalesContract::query()
            ->where('status', 'active')
            ->whereNotNull('end_date')
            ->with('customer');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()->map(function ($contract) {
            $reminderDate = $contract->end_date
                ->copy()
                ->subDays((int) $contract->renewal_notice_days);

            if ($reminderDate->gt(now())) {
                return null;
            }

            return SalesRenewal::updateOrCreate(
                [
                    'sales_contract_id' => $contract->id,
                    'expiry_date' => $contract->end_date->toDateString(),
                ],
                [
                    'branch_id' => $contract->branch_id,
                    'customer_id' => $contract->customer_id,
                    'renewal_number' => 'REN-' . $contract->contract_number,
                    'status' => 'open',
                    'renewal_value' => $contract->value,
                    'reminder_date' => $reminderDate->toDateString(),
                    'probability' => 60,
                    'notes' => 'Generated from active contract.',
                ]
            );
        })->filter()->values();
    }

    public function convertToOpportunity(
        SalesRenewal $renewal,
        ?int $actorId = null
    ): SalesOpportunity {
        if ($renewal->opportunity) {
            return $renewal->opportunity;
        }

        $opportunity = SalesOpportunity::create([
            'branch_id' => $renewal->branch_id,
            'customer_id' => $renewal->customer_id,
            'opportunity_number' => 'OP-REN-' . now()->format('ymdHis') . '-' . random_int(100, 999),
            'name' => 'Renewal - ' . $renewal->contract?->contract_number,
            'description' => 'Generated from renewal.',
            'stage' => 'qualification',
            'status' => 'open',
            'priority' => 'high',
            'source' => 'renewal',
            'expected_value' => $renewal->renewal_value,
            'probability' => $renewal->probability,
            'expected_close_date' => $renewal->expiry_date,
            'owner_id' => $renewal->owner_id,
            'created_by' => $actorId,
            'last_activity_at' => now(),
        ]);

        $renewal->update([
            'opportunity_id' => $opportunity->id,
            'status' => 'converted',
            'converted_at' => now(),
        ]);

        return $opportunity->fresh(['customer', 'branch', 'owner']);
    }
}
