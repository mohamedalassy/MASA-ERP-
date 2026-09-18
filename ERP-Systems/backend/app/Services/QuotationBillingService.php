<?php

namespace App\Services;

use App\Models\ProjectQuotation;
use App\Models\TaxInvoice;
use Illuminate\Validation\ValidationException;

class QuotationBillingService
{
    public function assertApproved(ProjectQuotation $quotation): void
    {
        if ($quotation->status !== 'approved') {
            throw ValidationException::withMessages([
                'quotation_id' => 'لا يمكن إصدار فاتورة من عرض سعر غير معتمد.',
            ]);
        }
    }

    public function assertProjectMatches(
        ProjectQuotation $quotation,
        ?int $projectId
    ): void {
        if ($projectId === null) {
            return;
        }

        if ((int) $quotation->project_id !== (int) $projectId) {
            throw ValidationException::withMessages([
                'project_id' => 'المشروع المحدد لا يطابق مشروع عرض السعر.',
            ]);
        }
    }

    public function summary(ProjectQuotation $quotation): array
    {
        $quotationTotal = round((float) $quotation->total, 2);

        $invoiced = (float) TaxInvoice::query()
            ->where('quotation_id', $quotation->id)
            ->where('document_type', 'invoice')
            ->whereNotIn('status', [
                'cancelled',
                'void',
            ])
            ->sum('total');

        $invoiced = round($invoiced, 2);

        $remaining = round(
            max(0, $quotationTotal - $invoiced),
            2
        );

        return [
            'quotation_id' => $quotation->id,
            'quotation_number' => $quotation->quotation_number,

            'quotation_total' => $quotationTotal,

            'invoiced_total' => $invoiced,

            'remaining_total' => $remaining,

            // Aliases used by finance/UI.
            'total' => $quotationTotal,
            'invoiced' => $invoiced,
            'remaining' => $remaining,

            'is_fully_invoiced' => $remaining <= 0,
        ];
    }

    public function assertAmountWithinRemaining(
        ProjectQuotation $quotation,
        float $amount,
        bool $allowOverride = false
    ): void {
        if ($allowOverride) {
            return;
        }

        $summary = $this->summary($quotation);

        if (
            round($amount, 2) >
            round((float) $summary['remaining_total'], 2)
        ) {
            throw ValidationException::withMessages([
                'items' => sprintf(
                    'قيمة الفاتورة %.2f تتجاوز المتبقي من عرض السعر %.2f.',
                    $amount,
                    $summary['remaining_total']
                ),
            ]);
        }
    }

    public function previouslyInvoicedQuantity(
        int $quotationId,
        int $quotationItemId
    ): float {
        $quantity = TaxInvoice::query()
            ->join(
                'tax_invoice_items',
                'tax_invoices.id',
                '=',
                'tax_invoice_items.tax_invoice_id'
            )
            ->where(
                'tax_invoices.quotation_id',
                $quotationId
            )
            ->where(
                'tax_invoice_items.quotation_item_id',
                $quotationItemId
            )
            ->where(
                'tax_invoices.document_type',
                'invoice'
            )
            ->whereNotIn(
                'tax_invoices.status',
                [
                    'cancelled',
                    'void',
                ]
            )
            ->sum('tax_invoice_items.quantity');

        return round((float) $quantity, 4);
    }
}