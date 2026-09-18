<?php

namespace App\Services\Sales;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesOrderProcurementService
{
    public function createPurchaseOrder(
        SalesOrder $salesOrder,
        int $supplierId,
        ?int $actorId = null
    ): PurchaseOrder {
        $shortages = $salesOrder->shortages()
            ->where('status', 'open')
            ->with('product')
            ->get();

        if ($shortages->isEmpty()) {
            throw ValidationException::withMessages([
                'sales_order' => 'لا توجد نواقص مفتوحة لإنشاء أمر شراء.',
            ]);
        }

        return DB::transaction(function () use (
            $salesOrder,
            $supplierId,
            $actorId,
            $shortages
        ) {
            $poNumber = 'PO-' . now()->format('Y') . '-' .
                str_pad((string) ((PurchaseOrder::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);

            $purchaseOrder = PurchaseOrder::create([
                'branch_id' => $salesOrder->branch_id,
                'project_id' => $salesOrder->project_id,
                'supplier_id' => $supplierId,
                'po_number' => $poNumber,
                'status' => 'draft',
                'subtotal' => 0,
                'discount' => 0,
                'tax' => 0,
                'total' => 0,
                'order_date' => now()->toDateString(),
                'notes' => "Auto-created from Sales Order {$salesOrder->order_number}",
                'created_by' => $actorId,
            ]);

            $subtotal = 0;
            $tax = 0;
            $total = 0;
            $sort = 1;

            foreach ($shortages as $shortage) {
                $product = $shortage->product;
                $quantity = (float) $shortage->shortage_quantity;
                $unitCost = (float) ($product?->cost_price ?? 0);
                $taxRate = (float) ($product?->tax_rate ?? 15);
                $lineSubtotal = $quantity * $unitCost;
                $taxAmount = $lineSubtotal * ($taxRate / 100);
                $lineTotal = $lineSubtotal + $taxAmount;

                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    'product_id' => $shortage->product_id,
                    'product_name' => $product?->name ?? 'Product',
                    'sku' => $product?->sku,
                    'description' => "Shortage for {$salesOrder->order_number}",
                    'quantity' => $quantity,
                    'received_quantity' => 0,
                    'unit_cost' => $unitCost,
                    'discount' => 0,
                    'tax_rate' => $taxRate,
                    'tax_amount' => round($taxAmount, 2),
                    'line_total' => round($lineTotal, 2),
                    'sort_order' => $sort++,
                ]);

                $shortage->update([
                    'status' => 'purchase_order_created',
                    'purchase_order_id' => $purchaseOrder->id,
                ]);

                $subtotal += $lineSubtotal;
                $tax += $taxAmount;
                $total += $lineTotal;
            }

            $purchaseOrder->update([
                'subtotal' => round($subtotal, 2),
                'tax' => round($tax, 2),
                'total' => round($total, 2),
            ]);

            return $purchaseOrder->fresh([
                'supplier',
                'items.product',
                'project',
            ]);
        });
    }
}
