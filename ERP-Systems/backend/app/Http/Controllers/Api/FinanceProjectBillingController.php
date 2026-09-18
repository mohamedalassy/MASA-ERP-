<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectQuotation;
use App\Models\TaxInvoice;
use App\Services\QuotationBillingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceProjectBillingController extends Controller
{
    public function __construct(
        private readonly QuotationBillingService $billingService
    ) {
    }

    /**
     * Overview of project billing across all quotations/invoices.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Project::query()
            ->withCount('quotations');

        if ($request->filled('search')) {
            $search = trim(
                $request->string('search')->toString()
            );

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere(
                        'project_number',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        $projects = $query
            ->orderByDesc('id')
            ->get()
            ->map(function (Project $project) {
                return $this->projectBillingData($project);
            });

        return response()->json([
            'data' => $projects,
        ]);
    }

    /**
     * Billing summary for one project.
     */
    public function project(Project $project): JsonResponse
    {
        return response()->json([
            'data' => $this->projectBillingData($project),
        ]);
    }

    /**
     * Billing summary for one quotation.
     */
    public function quotation(
        ProjectQuotation $quotation
    ): JsonResponse {
        $quotation->load([
            'project',
            'items',
        ]);

        $summary =
            $this->billingService->summary($quotation);

        $items = $quotation->items
            ->map(function ($item) use ($quotation) {
                $sourceQuantity = round(
                    (float) $item->quantity,
                    4
                );

                $previouslyInvoiced =
                    $this->billingService
                        ->previouslyInvoicedQuantity(
                            $quotation->id,
                            $item->id
                        );

                $remainingQuantity = round(
                    max(
                        0,
                        $sourceQuantity -
                        $previouslyInvoiced
                    ),
                    4
                );

                return [
                    'id' => $item->id,

                    'product_id' =>
                        $item->product_id,

                    'product_name' =>
                        $item->product_name,

                    'description' =>
                        $item->description,

                    'unit' =>
                        $item->unit,

                    'quantity' =>
                        $sourceQuantity,

                    'unit_price' =>
                        (float) $item->unit_price,

                    'line_total' =>
                        (float) $item->line_total,

                    'previously_invoiced_quantity' =>
                        $previouslyInvoiced,

                    'remaining_quantity' =>
                        $remainingQuantity,
                ];
            })
            ->values();

        return response()->json([
            'data' => [
                'quotation' => [
                    'id' =>
                        $quotation->id,

                    'quotation_number' =>
                        $quotation->quotation_number,

                    'project_id' =>
                        $quotation->project_id,

                    'status' =>
                        $quotation->status,

                    'subtotal' =>
                        (float) $quotation->subtotal,

                    'discount' =>
                        (float) $quotation->discount,

                    'tax' =>
                        (float) $quotation->tax,

                    'total' =>
                        (float) $quotation->total,
                ],

                'billing' => $summary,

                'items' => $items,
            ],
        ]);
    }

    private function projectBillingData(
        Project $project
    ): array {
        $quotations = ProjectQuotation::query()
            ->where('project_id', $project->id)
            ->orderByDesc('id')
            ->get();

        $quotationTotal = round(
            (float) $quotations->sum('total'),
            2
        );

        $approvedQuotationTotal = round(
            (float) $quotations
                ->where('status', 'approved')
                ->sum('total'),
            2
        );

        $invoiceQuery = TaxInvoice::query()
            ->where('project_id', $project->id)
            ->where('document_type', 'invoice')
            ->whereNotIn(
                'status',
                [
                    'cancelled',
                    'void',
                ]
            );

        $invoicedTotal = round(
            (float) (clone $invoiceQuery)->sum('total'),
            2
        );

        $paidTotal = round(
            (float) (clone $invoiceQuery)->sum('paid_amount'),
            2
        );

        $remainingReceivable = round(
            max(
                0,
                $invoicedTotal - $paidTotal
            ),
            2
        );

        $remainingToInvoice = round(
            max(
                0,
                $approvedQuotationTotal -
                $invoicedTotal
            ),
            2
        );

        return [
            'project' => [
                'id' => $project->id,

                'name' =>
                    $project->name ?? null,

                'project_number' =>
                    $project->project_number ?? null,
            ],

            'summary' => [
                'quotations_count' =>
                    $quotations->count(),

                'approved_quotations_count' =>
                    $quotations
                        ->where('status', 'approved')
                        ->count(),

                'quotation_total' =>
                    $quotationTotal,

                'approved_quotation_total' =>
                    $approvedQuotationTotal,

                'invoiced_total' =>
                    $invoicedTotal,

                'paid_total' =>
                    $paidTotal,

                'remaining_receivable' =>
                    $remainingReceivable,

                'remaining_to_invoice' =>
                    $remainingToInvoice,
            ],

            'quotations' => $quotations
                ->map(function ($quotation) {
                    return [
                        'id' =>
                            $quotation->id,

                        'quotation_number' =>
                            $quotation->quotation_number,

                        'status' =>
                            $quotation->status,

                        'total' =>
                            (float) $quotation->total,

                        'billing' =>
                            $this->billingService
                                ->summary($quotation),
                    ];
                })
                ->values(),
        ];
    }
}