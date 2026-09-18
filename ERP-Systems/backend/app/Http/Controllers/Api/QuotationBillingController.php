<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectQuotation;
use App\Services\QuotationBillingService;
use Illuminate\Http\JsonResponse;

class QuotationBillingController extends Controller
{
    public function __construct(
        private readonly QuotationBillingService $billingService
    ) {
    }

    public function show(
        ProjectQuotation $quotation
    ): JsonResponse {
        $quotation->load([
            'project',
            'items',
        ]);

        $summary =
            $this->billingService->summary($quotation);

        $items = $quotation->items->map(
            function ($item) use ($quotation) {
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
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'sku' => $item->sku,
                    'description' => $item->description,
                    'unit' => $item->unit,

                    'quantity' => $sourceQuantity,

                    'unit_price' => (float) $item->unit_price,
                    'discount' => (float) $item->discount,
                    'tax_rate' => (float) $item->tax_rate,
                    'tax_amount' => (float) $item->tax_amount,
                    'line_total' => (float) $item->line_total,

                    'previously_invoiced_quantity' =>
                        $previouslyInvoiced,

                    'remaining_quantity' =>
                        $remainingQuantity,
                ];
            }
        )->values();

        return response()->json([
            'data' => [
                'quotation' => [
                    'id' => $quotation->id,

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
}