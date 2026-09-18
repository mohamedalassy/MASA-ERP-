<?php

namespace App\Services\Sales;

use App\Models\BranchProductStock;
use App\Models\SalesOrder;
use App\Models\SalesOrderStockShortage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesOrderReservationService
{
    public function confirmAndReserve(
        SalesOrder $order,
        ?int $actorId = null
    ): SalesOrder {
        if (!in_array($order->status, ['draft', 'pending'], true)) {
            throw ValidationException::withMessages([
                'sales_order' => 'لا يمكن تأكيد Sales Order في حالته الحالية.',
            ]);
        }

        return DB::transaction(function () use ($order, $actorId) {
            $order->loadMissing('items');

            $order->shortages()->delete();

            $hasShortage = false;

            foreach ($order->items as $item) {
                $required = (float) $item->quantity;

                if (!$item->product_id || $item->item_type !== 'inventory') {
                    $item->update([
                        'reserved_quantity' => 0,
                        'shortage_quantity' => 0,
                    ]);
                    continue;
                }

                $stock = BranchProductStock::query()
                    ->where('branch_id', $order->branch_id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock) {
                    $stock = BranchProductStock::create([
                        'branch_id' => $order->branch_id,
                        'product_id' => $item->product_id,
                        'stock_quantity' => 0,
                        'reserved_quantity' => 0,
                        'average_cost' => 0,
                    ]);

                    $stock = BranchProductStock::query()
                        ->whereKey($stock->id)
                        ->lockForUpdate()
                        ->firstOrFail();
                }

                $available = max(
                    0,
                    (float) $stock->stock_quantity
                    - (float) $stock->reserved_quantity
                );

                $reserved = min($required, $available);
                $shortage = max(0, $required - $reserved);

                if ($reserved > 0) {
                    $stock->update([
                        'reserved_quantity' =>
                            (float) $stock->reserved_quantity + $reserved,
                    ]);
                }

                $item->update([
                    'reserved_quantity' => $reserved,
                    'shortage_quantity' => $shortage,
                ]);

                if ($shortage > 0) {
                    $hasShortage = true;

                    SalesOrderStockShortage::create([
                        'branch_id' => $order->branch_id,
                        'sales_order_id' => $order->id,
                        'sales_order_item_id' => $item->id,
                        'product_id' => $item->product_id,
                        'required_quantity' => $required,
                        'available_quantity' => $available,
                        'shortage_quantity' => $shortage,
                        'status' => 'open',
                    ]);
                }
            }

            $order->update([
                'status' => $hasShortage
                    ? 'confirmed_with_shortage'
                    : 'confirmed',
                'confirmed_by' => $actorId,
                'confirmed_at' => now(),
            ]);

            return $order->fresh([
                'items.product',
                'shortages.product',
                'customer',
                'project',
                'quotation',
            ]);
        });
    }

    public function release(SalesOrder $order): void
    {
        DB::transaction(function () use ($order) {
            $order->loadMissing('items');

            foreach ($order->items as $item) {
                $reserved = (float) $item->reserved_quantity;

                if (!$item->product_id || $reserved <= 0) {
                    continue;
                }

                $stock = BranchProductStock::query()
                    ->where('branch_id', $order->branch_id)
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if ($stock) {
                    $stock->update([
                        'reserved_quantity' => max(
                            0,
                            (float) $stock->reserved_quantity - $reserved
                        ),
                    ]);
                }

                $item->update([
                    'reserved_quantity' => 0,
                ]);
            }

            $order->shortages()
                ->where('status', 'open')
                ->update(['status' => 'cancelled']);
        });
    }
}
