<?php

namespace App\Services;

class TaxInvoiceCalculator
{
    public function calculate(array $items): array
    {
        $calculatedItems = [];

        $subtotal = 0.0;
        $discountTotal = 0.0;
        $taxableAmount = 0.0;
        $taxTotal = 0.0;
        $grandTotal = 0.0;

        foreach ($items as $index => $item) {
            $quantity = round(
                (float) ($item['quantity'] ?? 0),
                4
            );

            $unitPrice = round(
                (float) ($item['unit_price'] ?? 0),
                4
            );

            $discountAmount = round(
                (float) ($item['discount_amount'] ?? 0),
                2
            );

            $taxRate = round(
                (float) ($item['tax_rate'] ?? 0),
                2
            );

            $grossAmount = round(
                $quantity * $unitPrice,
                2
            );

            $discountAmount = min(
                max(0, $discountAmount),
                $grossAmount
            );

            $itemTaxableAmount = round(
                max(
                    0,
                    $grossAmount - $discountAmount
                ),
                2
            );

            $itemTaxAmount = round(
                $itemTaxableAmount *
                ($taxRate / 100),
                2
            );

            $lineTotal = round(
                $itemTaxableAmount + $itemTaxAmount,
                2
            );

            $calculatedItems[] = array_merge(
                $item,
                [
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount_amount' => $discountAmount,
                    'tax_rate' => $taxRate,
                    'taxable_amount' => $itemTaxableAmount,
                    'tax_amount' => $itemTaxAmount,
                    'line_total' => $lineTotal,
                    'sort_order' =>
                        $item['sort_order'] ?? $index,
                ]
            );

            $subtotal += $grossAmount;
            $discountTotal += $discountAmount;
            $taxableAmount += $itemTaxableAmount;
            $taxTotal += $itemTaxAmount;
            $grandTotal += $lineTotal;
        }

        return [
            'items' => $calculatedItems,

            'totals' => [
                'subtotal' => round($subtotal, 2),

                'discount_total' => round(
                    $discountTotal,
                    2
                ),

                'taxable_amount' => round(
                    $taxableAmount,
                    2
                ),

                'tax_total' => round(
                    $taxTotal,
                    2
                ),

                'total' => round(
                    $grandTotal,
                    2
                ),
            ],
        ];
    }
}