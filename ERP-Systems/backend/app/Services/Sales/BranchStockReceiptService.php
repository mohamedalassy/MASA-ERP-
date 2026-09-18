<?php

namespace App\Services\Sales;

use App\Models\BranchProductStock;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\PurchaseOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BranchStockReceiptService
{
    public function receive(
        PurchaseOrder $purchaseOrder,
        array $items,
        ?int $actorId = null
    ): PurchaseOrder {
        if (!in_array($purchaseOrder->status, ['approved', 'partially_received'], true)) {
            throw ValidationException::withMessages([
                'purchase_order' => 'يمكن استلام أوامر الشراء المعتمدة فقط.',
            ]);
        }

        return DB::transaction(function () use ($purchaseOrder, $items, $actorId) {
            foreach ($items as $receivedItem) {
                $item = $purchaseOrder->items()
                    ->whereKey($receivedItem['item_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $newReceived = (float) $receivedItem['received_quantity'];
                $oldReceived = (float) $item->received_quantity;
                $ordered = (float) $item->quantity;

                if ($newReceived > $ordered || $newReceived < $oldReceived) {
                    throw ValidationException::withMessages([
                        'items' => 'كمية الاستلام غير صالحة.',
                    ]);
                }

                $delta = $newReceived - $oldReceived;

                if ($delta <= 0) {
                    continue;
                }

                if (!$item->product_id) {
                    throw ValidationException::withMessages([
                        'items' => 'يوجد صنف غير مرتبط بمنتج.',
                    ]);
                }

                $product = Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $branchStock = BranchProductStock::query()
                    ->where('branch_id', $purchaseOrder->branch_id)
                    ->where('product_id', $product->id)
                    ->lockForUpdate()
                    ->first();

                if (!$branchStock) {
                    $branchStock = BranchProductStock::create([
                        'branch_id' => $purchaseOrder->branch_id,
                        'product_id' => $product->id,
                        'stock_quantity' => 0,
                        'reserved_quantity' => 0,
                        'average_cost' => 0,
                    ]);

                    $branchStock = BranchProductStock::query()
                        ->whereKey($branchStock->id)
                        ->lockForUpdate()
                        ->firstOrFail();
                }

                $branchBefore = (float) $branchStock->stock_quantity;
                $branchAfter = $branchBefore + $delta;

                $newAverageCost = $this->weightedAverage(
                    $branchBefore,
                    (float) $branchStock->average_cost,
                    $delta,
                    (float) $item->unit_cost
                );

                $branchStock->update([
                    'stock_quantity' => round($branchAfter, 2),
                    'average_cost' => round($newAverageCost, 2),
                ]);

                // Keep legacy global stock in sync during transition.
                $globalBefore = (float) $product->stock_quantity;
                $product->update([
                    'stock_quantity' => round($globalBefore + $delta, 2),
                ]);

                $item->update([
                    'received_quantity' => round($newReceived, 2),
                ]);

                InventoryTransaction::create([
                    'branch_id' => $purchaseOrder->branch_id,
                    'product_id' => $product->id,
                    'project_id' => $purchaseOrder->project_id,
                    'purchase_order_id' => $purchaseOrder->id,
                    'purchase_order_item_id' => $item->id,
                    'type' => 'IN',
                    'quantity' => round($delta, 2),
                    'unit_cost' => (float) $item->unit_cost,
                    'stock_before' => round($branchBefore, 2),
                    'stock_after' => round($branchAfter, 2),
                    'reference' => $purchaseOrder->po_number,
                    'notes' => 'Branch stock receipt',
                    'created_by' => $actorId,
                ]);
            }

            $purchaseOrder->refresh();
            $allItems = $purchaseOrder->items()->get();

            $allReceived = $allItems->isNotEmpty()
                && $allItems->every(
                    fn ($item) =>
                        (float) $item->received_quantity >= (float) $item->quantity
                );

            $anyReceived = $allItems->contains(
                fn ($item) => (float) $item->received_quantity > 0
            );

            $purchaseOrder->update([
                'status' => $allReceived
                    ? 'completed'
                    : ($anyReceived ? 'partially_received' : 'approved'),
                'actual_delivery_date' => $allReceived
                    ? now()->toDateString()
                    : $purchaseOrder->actual_delivery_date,
            ]);

            return $purchaseOrder->fresh([
                'branch',
                'supplier',
                'items.product',
                'project',
            ]);
        });
    }

    private function weightedAverage(
        float $oldQty,
        float $oldCost,
        float $newQty,
        float $newCost
    ): float {
        $totalQty = $oldQty + $newQty;

        if ($totalQty <= 0) {
            return 0;
        }

        return (($oldQty * $oldCost) + ($newQty * $newCost)) / $totalQty;
    }
}
