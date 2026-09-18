<?php

namespace App\Services\Sales;

use App\Models\Customer;
use App\Models\CustomerCreditProfile;
use App\Models\SalesContract;
use App\Models\SalesDealHealthSnapshot;
use App\Models\SalesForecastSnapshot;
use App\Models\SalesInvoice;
use App\Models\SalesOpportunity;
use App\Models\SalesOrder;
use App\Models\SalesPayment;
use App\Models\SalesRevenueLeakage;
use App\Models\SalesTarget;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class SalesIntelligenceService
{
    public function forecast(?int $branchId = null): array
    {
        $query = SalesOpportunity::query()
            ->where('status', 'open');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $items = $query->get();

        $pipeline = (float) $items->sum('expected_value');
        $weighted = (float) $items->sum(
            fn ($item) => (float) $item->expected_value * ((int) $item->probability / 100)
        );

        $committed = (float) $items
            ->where('probability', '>=', 80)
            ->sum('expected_value');

        $likely = (float) $items
            ->where('probability', '>=', 50)
            ->sum('expected_value');

        $upside = $pipeline;

        $targetQuery = SalesTarget::query()
            ->whereDate('period_start', '<=', now())
            ->whereDate('period_end', '>=', now());

        if ($branchId) {
            $targetQuery->where('branch_id', $branchId);
        }

        $target = (float) $targetQuery->sum('target_amount');

        return [
            'committed_value' => round($committed, 2),
            'likely_value' => round($likely, 2),
            'upside_value' => round($upside, 2),
            'pipeline_value' => round($pipeline, 2),
            'weighted_pipeline' => round($weighted, 2),
            'target_value' => round($target, 2),
            'coverage_ratio' => $target > 0 ? round($pipeline / $target, 2) : 0,
        ];
    }

    public function refreshDealHealth(?int $branchId = null): Collection
    {
        $query = SalesOpportunity::query()
            ->where('status', 'open')
            ->with(['customer', 'owner']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()->map(function ($opportunity) {
            $daysSinceActivity = $opportunity->last_activity_at
                ? Carbon::parse($opportunity->last_activity_at)->diffInDays(now())
                : 30;

            $score = 100;

            if ($daysSinceActivity >= 14) {
                $score -= 35;
            } elseif ($daysSinceActivity >= 7) {
                $score -= 20;
            } elseif ($daysSinceActivity >= 4) {
                $score -= 10;
            }

            if ((int) $opportunity->probability < 30) {
                $score -= 20;
            } elseif ((int) $opportunity->probability < 50) {
                $score -= 10;
            }

            $closeRisk = false;

            if ($opportunity->expected_close_date) {
                $daysToClose = now()->startOfDay()->diffInDays(
                    Carbon::parse($opportunity->expected_close_date),
                    false
                );

                if ($daysToClose < 0) {
                    $score -= 25;
                    $closeRisk = true;
                } elseif ($daysToClose <= 7 && (int) $opportunity->probability < 70) {
                    $score -= 10;
                    $closeRisk = true;
                }
            }

            $score = max(0, min(100, $score));

            $health = $score >= 75
                ? 'healthy'
                : ($score >= 50 ? 'watch' : 'at_risk');

            $riskLevel = $score >= 75
                ? 'low'
                : ($score >= 50 ? 'medium' : 'high');

            $snapshot = SalesDealHealthSnapshot::updateOrCreate(
                [
                    'opportunity_id' => $opportunity->id,
                    'snapshot_date' => now()->toDateString(),
                ],
                [
                    'branch_id' => $opportunity->branch_id,
                    'score' => $score,
                    'health' => $health,
                    'risk_level' => $riskLevel,
                    'days_since_activity' => $daysSinceActivity,
                    'stage_age_days' => $daysSinceActivity,
                    'margin_risk' => false,
                    'activity_risk' => $daysSinceActivity >= 7,
                    'close_date_risk' => $closeRisk,
                ]
            );

            return $snapshot->load('opportunity.customer');
        });
    }

    public function detectRevenueLeakage(?int $branchId = null): Collection
    {
        $created = collect();

        $orders = SalesOrder::query()
            ->whereIn('status', ['delivered', 'invoiced'])
            ->whereDoesntHave('contracts');

        if ($branchId) {
            $orders->where('branch_id', $branchId);
        }

        foreach ($orders->get() as $order) {
            $invoiceExists = SalesInvoice::query()
                ->where('sales_order_id', $order->id)
                ->whereNotIn('status', ['cancelled'])
                ->exists();

            if (!$invoiceExists) {
                $created->push(SalesRevenueLeakage::updateOrCreate(
                    [
                        'sales_order_id' => $order->id,
                        'source_type' => 'delivered_not_invoiced',
                        'status' => 'open',
                    ],
                    [
                        'branch_id' => $order->branch_id,
                        'customer_id' => $order->customer_id,
                        'source_reference' => $order->order_number,
                        'amount' => $order->total,
                        'severity' => 'high',
                        'detected_at' => now(),
                    ]
                ));
            }
        }

        $invoices = SalesInvoice::query()
            ->whereIn('status', ['posted', 'partially_paid'])
            ->where('remaining_amount', '>', 0);

        if ($branchId) {
            $invoices->where('branch_id', $branchId);
        }

        foreach ($invoices->get() as $invoice) {
            if ($invoice->due_date && Carbon::parse($invoice->due_date)->isPast()) {
                $created->push(SalesRevenueLeakage::updateOrCreate(
                    [
                        'sales_invoice_id' => $invoice->id,
                        'source_type' => 'overdue_invoice',
                        'status' => 'open',
                    ],
                    [
                        'branch_id' => $invoice->branch_id,
                        'customer_id' => $invoice->customer_id,
                        'sales_order_id' => $invoice->sales_order_id,
                        'source_reference' => $invoice->invoice_number,
                        'amount' => $invoice->remaining_amount,
                        'severity' => 'high',
                        'detected_at' => now(),
                    ]
                ));
            }
        }

        $contracts = SalesContract::query()
            ->where('status', 'active')
            ->whereNotNull('end_date');

        if ($branchId) {
            $contracts->where('branch_id', $branchId);
        }

        foreach ($contracts->get() as $contract) {
            $noticeDate = Carbon::parse($contract->end_date)
                ->subDays((int) $contract->renewal_notice_days);

            if ($noticeDate->lte(now())) {
                $created->push(SalesRevenueLeakage::updateOrCreate(
                    [
                        'sales_contract_id' => $contract->id,
                        'source_type' => 'renewal_due',
                        'status' => 'open',
                    ],
                    [
                        'branch_id' => $contract->branch_id,
                        'customer_id' => $contract->customer_id,
                        'sales_order_id' => $contract->sales_order_id,
                        'source_reference' => $contract->contract_number,
                        'amount' => $contract->value,
                        'severity' => 'medium',
                        'detected_at' => now(),
                    ]
                ));
            }
        }

        return $created;
    }

    public function customerProfitability(?int $branchId = null): Collection
    {
        $query = Customer::query()->with([
            'projects',
        ]);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()->map(function ($customer) {
            $revenue = (float) SalesInvoice::query()
                ->where('customer_id', $customer->id)
                ->whereNotIn('status', ['draft', 'cancelled'])
                ->sum('total');

            $collected = (float) SalesPayment::query()
                ->where('customer_id', $customer->id)
                ->where('status', 'posted')
                ->sum('amount');

            $grossCost = (float) SalesOrder::query()
                ->where('customer_id', $customer->id)
                ->with('items.product')
                ->get()
                ->sum(function ($order) {
                    return $order->items->sum(
                        fn ($item) =>
                            (float) $item->quantity
                            * (float) ($item->product?->cost_price ?? 0)
                    );
                });

            $profit = $revenue - $grossCost;

            return [
                'customer_id' => $customer->id,
                'customer' => $customer->name,
                'revenue' => round($revenue, 2),
                'collected' => round($collected, 2),
                'estimated_cost' => round($grossCost, 2),
                'net_profit' => round($profit, 2),
                'margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0,
            ];
        });
    }

    public function refreshCreditProfiles(?int $branchId = null): Collection
    {
        $query = Customer::query();

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->get()->map(function ($customer) {
            $openInvoices = SalesInvoice::query()
                ->where('customer_id', $customer->id)
                ->whereIn('status', ['posted', 'partially_paid']);

            $used = (float) $openInvoices->sum('remaining_amount');

            $overdue = (float) SalesInvoice::query()
                ->where('customer_id', $customer->id)
                ->whereIn('status', ['posted', 'partially_paid'])
                ->whereDate('due_date', '<', now()->toDateString())
                ->sum('remaining_amount');

            $limit = (float) $customer->credit_limit;
            $available = max(0, $limit - $used);

            $risk = $overdue > 0 && $used >= $limit
                ? 'high'
                : ($overdue > 0 ? 'medium' : 'low');

            return CustomerCreditProfile::updateOrCreate(
                ['customer_id' => $customer->id],
                [
                    'branch_id' => $customer->branch_id,
                    'credit_limit' => $limit,
                    'used_credit' => round($used, 2),
                    'available_credit' => round($available, 2),
                    'overdue_amount' => round($overdue, 2),
                    'average_delay_days' => 0,
                    'risk_status' => $risk,
                    'is_blocked' => $risk === 'high',
                ]
            );
        });
    }

    public function snapshotForecast(?int $branchId = null, ?int $actorId = null): SalesForecastSnapshot
    {
        $data = $this->forecast($branchId);

        return SalesForecastSnapshot::updateOrCreate(
            [
                'branch_id' => $branchId,
                'snapshot_date' => now()->toDateString(),
                'period_start' => now()->startOfMonth()->toDateString(),
                'period_end' => now()->endOfMonth()->toDateString(),
            ],
            [
                ...$data,
                'created_by' => $actorId,
            ]
        );
    }
}
