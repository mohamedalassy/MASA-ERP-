<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderItemController extends Controller
{
    /**
     * إضافة صنف إلى أمر الشراء
     */
    public function store(
        Request $request,
        PurchaseOrder $purchaseOrder
    ) {
        $validated = $request->validate([
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'quantity' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'unit_cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'discount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'tax_rate' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $product = Product::findOrFail(
            $validated['product_id']
        );

        $quantity = (float) $validated['quantity'];

        $unitCost = (float) (
            $validated['unit_cost']
            ?? $product->cost_price
            ?? 0
        );

        $discount = (float) (
            $validated['discount'] ?? 0
        );

        $taxRate = (float) (
            $validated['tax_rate']
            ?? $product->tax_rate
            ?? 15
        );

        [
            'tax_amount' => $taxAmount,
            'line_total' => $lineTotal,
        ] = $this->calculateLine(
            $quantity,
            $unitCost,
            $discount,
            $taxRate
        );

        $item = DB::transaction(function () use (
            $purchaseOrder,
            $product,
            $validated,
            $quantity,
            $unitCost,
            $discount,
            $taxRate,
            $taxAmount,
            $lineTotal
        ) {
            $item = PurchaseOrderItem::create([
                'purchase_order_id' =>
                    $purchaseOrder->id,

                'product_id' =>
                    $product->id,

                'product_name' =>
                    $product->name,

                'sku' =>
                    $product->sku,

                'description' =>
                    $validated['description']
                    ?? $product->description,

                'quantity' =>
                    $quantity,

                'received_quantity' =>
                    0,

                'unit_cost' =>
                    $unitCost,

                'discount' =>
                    $discount,

                'tax_rate' =>
                    $taxRate,

                'tax_amount' =>
                    $taxAmount,

                'line_total' =>
                    $lineTotal,

                'sort_order' =>
                    (
                        $purchaseOrder
                            ->items()
                            ->max('sort_order')
                        ?? 0
                    ) + 1,
            ]);

            $this->recalculatePurchaseOrder(
                $purchaseOrder
            );

            return $item;
        });

        $item->load('product');

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم إضافة الصنف إلى أمر الشراء بنجاح.',

            'data' => [
                'item' => $item,

                'purchase_order' =>
                    $purchaseOrder,
            ],
        ], 201);
    }

    /**
     * تعديل صنف داخل أمر الشراء
     */
    public function update(
        Request $request,
        PurchaseOrder $purchaseOrder,
        PurchaseOrderItem $item
    ) {
        if (
            (int) $item->purchase_order_id !==
            (int) $purchaseOrder->id
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'الصنف لا يتبع أمر الشراء المحدد.',
            ], 422);
        }

        $validated = $request->validate([
            'quantity' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'unit_cost' => [
                'required',
                'numeric',
                'min:0',
            ],

            'discount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'tax_rate' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $quantity =
            (float) $validated['quantity'];

        $unitCost =
            (float) $validated['unit_cost'];

        $discount =
            (float) ($validated['discount'] ?? 0);

        $taxRate =
            (float) ($validated['tax_rate'] ?? 0);

        [
            'tax_amount' => $taxAmount,
            'line_total' => $lineTotal,
        ] = $this->calculateLine(
            $quantity,
            $unitCost,
            $discount,
            $taxRate
        );

        DB::transaction(function () use (
            $purchaseOrder,
            $item,
            $validated,
            $quantity,
            $unitCost,
            $discount,
            $taxRate,
            $taxAmount,
            $lineTotal
        ) {
            $item->update([
                'quantity' =>
                    $quantity,

                'unit_cost' =>
                    $unitCost,

                'discount' =>
                    $discount,

                'tax_rate' =>
                    $taxRate,

                'tax_amount' =>
                    $taxAmount,

                'line_total' =>
                    $lineTotal,

                'description' =>
                    $validated['description']
                    ?? $item->description,
            ]);

            $this->recalculatePurchaseOrder(
                $purchaseOrder
            );
        });

        $item->refresh();
        $item->load('product');

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم تعديل الصنف بنجاح.',

            'data' => [
                'item' => $item,

                'purchase_order' =>
                    $purchaseOrder,
            ],
        ]);
    }

    /**
     * حذف صنف من أمر الشراء
     */
    public function destroy(
        PurchaseOrder $purchaseOrder,
        PurchaseOrderItem $item
    ) {
        if (
            (int) $item->purchase_order_id !==
            (int) $purchaseOrder->id
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'الصنف لا يتبع أمر الشراء المحدد.',
            ], 422);
        }

        DB::transaction(function () use (
            $purchaseOrder,
            $item
        ) {
            $item->delete();

            $this->recalculatePurchaseOrder(
                $purchaseOrder
            );
        });

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم حذف الصنف بنجاح.',

            'data' => [
                'purchase_order' =>
                    $purchaseOrder,
            ],
        ]);
    }

    /**
     * حساب الضريبة والإجمالي لسطر واحد
     */
    private function calculateLine(
        float $quantity,
        float $unitCost,
        float $discount,
        float $taxRate
    ): array {
        $rawSubtotal =
            $quantity * $unitCost;

        $afterDiscount = max(
            $rawSubtotal - $discount,
            0
        );

        $taxAmount =
            $afterDiscount * ($taxRate / 100);

        $lineTotal =
            $afterDiscount + $taxAmount;

        return [
            'tax_amount' =>
                round($taxAmount, 2),

            'line_total' =>
                round($lineTotal, 2),
        ];
    }

    /**
     * إعادة حساب إجماليات أمر الشراء
     */
    private function recalculatePurchaseOrder(
        PurchaseOrder $purchaseOrder
    ): void {
        $items = $purchaseOrder
            ->items()
            ->get();

        $subtotalTotal = $items->sum(
            function ($item) {
                return
                    (float) $item->quantity
                    *
                    (float) $item->unit_cost;
            }
        );

        $discountTotal = $items->sum(
            function ($item) {
                return (float) $item->discount;
            }
        );

        $taxTotal = $items->sum(
            function ($item) {
                return (float) $item->tax_amount;
            }
        );

        $grandTotal = $items->sum(
            function ($item) {
                return (float) $item->line_total;
            }
        );

        $purchaseOrder->update([
            'subtotal' =>
                round($subtotalTotal, 2),

            'discount' =>
                round($discountTotal, 2),

            'tax' =>
                round($taxTotal, 2),

            'total' =>
                round($grandTotal, 2),
        ]);
    }
}
