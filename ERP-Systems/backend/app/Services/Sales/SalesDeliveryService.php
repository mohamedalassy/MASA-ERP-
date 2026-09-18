<?php

namespace App\Services\Sales;

use App\Models\BranchProductStock;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\SalesDelivery;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesDeliveryService
{
    public function deliver(
        SalesOrder $salesOrder,
        array $payload,
        ?int $actorId = null
    ): SalesDelivery {
        if (!in_array(
            $salesOrder->status,
            ['confirmed', 'confirmed_with_shortage', 'partially_delivered'],
            true
        )) {
            throw ValidationException::withMessages([
                'sales_order' => 'Sales Order غير جاهز للتسليم.',
            ]);
        }

        return DB::transaction(function () use ($salesOrder, $payload, $actorId) {
            $delivery = SalesDelivery::create([
                'branch_id' => $salesOrder->branch_id,
                'sales_order_id' => $salesOrder->id,
                'project_id' => $salesOrder->project_id,
                'delivery_number' => $this->nextDeliveryNumber(),
                'status' => 'delivered',
                'delivery_date' => $payload['delivery_date'] ?? now()->toDateString(),
                'delivered_by' => $actorId,
                'received_by_name' => $payload['received_by_name'] ?? null,
                'received_by_phone' => $payload['received_by_phone'] ?? null,
                'notes' => $payload['notes'] ?? null,
            ]);

            foreach ($payload['items'] as $row) {
                $orderItem = $salesOrder->items()
                    ->whereKey($row['sales_order_item_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $qty = (float) $row['quantity'];

                if ($qty <= 0) {
                    continue;
                }

                if (!$orderItem->product_id || $orderItem->item_type !== 'inventory') {
                    $delivery->items()->create([
                        'sales_order_item_id' => $orderItem->id,
                        'product_id' => $orderItem->product_id,
                        'quantity' => $qty,
                        'unit_cost' => 0,
                    ]);
                    continue;
                }

                $alreadyDelivered = (float) SalesDelivery::query()
                    ->where('sales_order_id', $salesOrder->id)
                    ->where('status', 'delivered')
                    ->with('items')
                    ->get()
                    ->flatMap->items
                    ->where('sales_order_item_id', $orderItem->id)
                    ->sum('quantity');

                if ($alreadyDelivered + $qty > (float) $orderItem->quantity) {
                    throw ValidationException::withMessages([
                        'items' => 'كمية التسليم تتجاوز كمية Sales Order.',
                    ]);
                }

                $stock = BranchProductStock::query()
                    ->where('branch_id', $salesOrder->branch_id)
                    ->where('product_id', $orderItem->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ((float) $stock->stock_quantity < $qty) {
                    throw ValidationException::withMessages([
                        'items' => "الرصيد الفعلي غير كافٍ للصنف {$orderItem->product_name}.",
                    ]);
                }

                $before = (float) $stock->stock_quantity;
                $after = $before - $qty;
                $reservedRelease = min(
                    $qty,
                    (float) $orderItem->reserved_quantity,
                    (float) $stock->reserved_quantity
                );

                $stock->update([
                    'stock_quantity' => round($after, 2),
                    'reserved_quantity' => round(
                        max(0, (float) $stock->reserved_quantity - $reservedRelease),
                        2
                    ),
                ]);

                $orderItem->update([
                    'reserved_quantity' => round(
                        max(0, (float) $orderItem->reserved_quantity - $reservedRelease),
                        2
                    ),
                ]);

                // Legacy global stock remains synchronized.
                $product = Product::query()
                    ->whereKey($orderItem->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $product->update([
                    'stock_quantity' => round(
                        max(0, (float) $product->stock_quantity - $qty),
                        2
                    ),
                ]);

                $deliveryItem = $delivery->items()->create([
                    'sales_order_item_id' => $orderItem->id,
                    'product_id' => $orderItem->product_id,
                    'quantity' => $qty,
                    'unit_cost' => (float) $stock->average_cost,
                ]);

                InventoryTransaction::create([
                    'branch_id' => $salesOrder->branch_id,
                    'product_id' => $orderItem->product_id,
                    'project_id' => $salesOrder->project_id,
                    'sales_order_id' => $salesOrder->id,
                    'sales_order_item_id' => $orderItem->id,
                    'sales_delivery_id' => $delivery->id,
                    'type' => 'OUT',
                    'quantity' => $qty,
                    'unit_cost' => (float) $stock->average_cost,
                    'stock_before' => round($before, 2),
                    'stock_after' => round($after, 2),
                    'reference' => $delivery->delivery_number,
                    'notes' => "Sales delivery {$salesOrder->order_number}",
                    'created_by' => $actorId,
                ]);
            }

            $salesOrder->refresh()->load('items');

            $allDelivered = $salesOrder->items->every(function ($item) use ($salesOrder) {
                if (!$item->product_id || $item->item_type !== 'inventory') {
                    return true;
                }

                $delivered = (float) SalesDelivery::query()
                    ->where('sales_order_id', $salesOrder->id)
                    ->where('status', 'delivered')
                    ->with('items')
                    ->get()
                    ->flatMap->items
                    ->where('sales_order_item_id', $item->id)
                    ->sum('quantity');

                return $delivered >= (float) $item->quantity;
            });

            $salesOrder->update([
                'status' => $allDelivered ? 'delivered' : 'partially_delivered',
            ]);

            if ($salesOrder->project) {
                $salesOrder->project->update([
                    'current_stage' => 'finance',
                ]);
            }

            return $delivery->fresh([
                'items.product',
                'salesOrder',
                'project',
                'deliveredBy',
            ]);
        });
    }

    private function nextDeliveryNumber(): string
    {
        return 'DLV-' . now()->format('Y') . '-' .
            str_pad((string) ((SalesDelivery::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);
    }
}
