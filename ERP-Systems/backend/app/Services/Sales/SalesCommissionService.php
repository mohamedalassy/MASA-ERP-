<?php

namespace App\Services\Sales;

use App\Models\SalesCommission;
use App\Models\SalesInvoice;
use App\Models\SalesOrder;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SalesCommissionService
{
    public function generate(
        Carbon $from,
        Carbon $to,
        ?int $branchId = null,
        float $defaultRate = 2.5
    ): Collection {
        $query = SalesInvoice::query()
            ->whereIn('status', ['partially_paid', 'paid'])
            ->whereBetween('invoice_date', [$from->toDateString(), $to->toDateString()])
            ->with(['salesOrder.project']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()
            ->map(function ($invoice) use ($from, $to, $defaultRate) {
                $order = $invoice->salesOrder;
                $project = $order?->project;

                $userId = $project?->created_by;

                if (!$userId) {
                    return null;
                }

                $eligible = (float) $invoice->paid_amount;
                $amount = $eligible * ($defaultRate / 100);

                return SalesCommission::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'sales_invoice_id' => $invoice->id,
                        'period_start' => $from->toDateString(),
                        'period_end' => $to->toDateString(),
                    ],
                    [
                        'branch_id' => $invoice->branch_id,
                        'sales_order_id' => $invoice->sales_order_id,
                        'basis' => 'collected',
                        'eligible_amount' => round($eligible, 2),
                        'rate' => $defaultRate,
                        'commission_amount' => round($amount, 2),
                        'status' => 'draft',
                    ]
                );
            })
            ->filter()
            ->values();
    }
}
