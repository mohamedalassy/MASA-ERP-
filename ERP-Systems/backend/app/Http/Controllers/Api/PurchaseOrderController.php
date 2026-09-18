<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseOrderController extends Controller
{
    public function index(Project $project)
    {
        $purchaseOrders = PurchaseOrder::query()
            ->where('project_id', $project->id)
            ->with([
                'supplier',
                'items',
            ])
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $purchaseOrders->count(),
            'data' => $purchaseOrders,
        ]);
    }

    public function store(
        Request $request,
        Project $project
    ) {
        $validated = $request->validate([
            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],
            'order_date' => [
                'nullable',
                'date',
            ],
            'expected_delivery_date' => [
                'nullable',
                'date',
            ],
            'payment_terms' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $lastOrder = PurchaseOrder::query()
            ->latest('id')
            ->first();

        $nextNumber =
            ($lastOrder?->id ?? 0) + 1;

        $poNumber =
            'PO-' .
            now()->format('Y') .
            '-' .
            str_pad(
                $nextNumber,
                5,
                '0',
                STR_PAD_LEFT
            );

        $purchaseOrder =
            PurchaseOrder::create([
                'project_id' =>
                    $project->id,
                'supplier_id' =>
                    $validated['supplier_id']
                    ?? null,
                'po_number' =>
                    $poNumber,
                'status' =>
                    'draft',
                'subtotal' =>
                    0,
                'discount' =>
                    0,
                'tax' =>
                    0,
                'total' =>
                    0,
                'order_date' =>
                    $validated['order_date']
                    ?? now()->toDateString(),
                'expected_delivery_date' =>
                    $validated[
                        'expected_delivery_date'
                    ] ?? null,
                'payment_terms' =>
                    $validated['payment_terms']
                    ?? null,
                'notes' =>
                    $validated['notes']
                    ?? null,
                'created_by' =>
                    $request->user()?->id,
            ]);

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'تم إنشاء أمر الشراء بنجاح.',
            'data' => $purchaseOrder,
        ], 201);
    }

    public function show(
        PurchaseOrder $purchaseOrder
    ) {
        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,
            'data' => $purchaseOrder,
        ]);
    }

    public function update(
        Request $request,
        PurchaseOrder $purchaseOrder
    ) {
        if ($purchaseOrder->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن تعديل أمر الشراء في حالة المسودة فقط.',
            ], 422);
        }

        $validated = $request->validate([
            'supplier_id' => [
                'nullable',
                'integer',
                'exists:suppliers,id',
            ],
            'order_date' => [
                'nullable',
                'date',
            ],
            'expected_delivery_date' => [
                'nullable',
                'date',
            ],
            'payment_terms' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $purchaseOrder->update([
            'supplier_id' =>
                $validated['supplier_id']
                ?? null,
            'order_date' =>
                $validated['order_date']
                ?? $purchaseOrder->order_date,
            'expected_delivery_date' =>
                $validated[
                    'expected_delivery_date'
                ] ?? null,
            'payment_terms' =>
                $validated['payment_terms']
                ?? null,
            'notes' =>
                $validated['notes']
                ?? null,
        ]);

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'تم تحديث بيانات أمر الشراء بنجاح.',
            'data' => $purchaseOrder,
        ]);
    }

    public function submitForApproval(
        PurchaseOrder $purchaseOrder
    ) {
        if ($purchaseOrder->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن إرسال أوامر الشراء المسودة فقط للمراجعة.',
            ], 422);
        }

        if (!$purchaseOrder->supplier_id) {
            return response()->json([
                'success' => false,
                'message' =>
                    'يجب اختيار المورد قبل إرسال أمر الشراء للمراجعة.',
            ], 422);
        }

        if ($purchaseOrder->items()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' =>
                    'يجب إضافة صنف واحد على الأقل قبل إرسال أمر الشراء للمراجعة.',
            ], 422);
        }

        $purchaseOrder->update([
            'status' => 'pending',
        ]);

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'تم إرسال أمر الشراء للمراجعة بنجاح.',
            'data' => $purchaseOrder,
        ]);
    }

    public function approve(
        Request $request,
        PurchaseOrder $purchaseOrder
    ) {
        if ($purchaseOrder->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن اعتماد أوامر الشراء قيد المراجعة فقط.',
            ], 422);
        }

        $purchaseOrder->update([
            'status' => 'approved',
            'approved_by' =>
                $request->user()?->id,
            'approved_at' =>
                now(),
        ]);

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'تم اعتماد أمر الشراء بنجاح.',
            'data' => $purchaseOrder,
        ]);
    }

    public function cancel(
        PurchaseOrder $purchaseOrder
    ) {
        if (
            !in_array(
                $purchaseOrder->status,
                ['draft', 'pending'],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'لا يمكن إلغاء أمر الشراء في حالته الحالية.',
            ], 422);
        }

        $purchaseOrder->update([
            'status' => 'cancelled',
        ]);

        $purchaseOrder->refresh();

        $purchaseOrder->load([
            'supplier',
            'items.product',
            'project',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'تم إلغاء أمر الشراء.',
            'data' => $purchaseOrder,
        ]);
    }

    /**
     * استلام أصناف أمر الشراء وإدخال الفرق الجديد إلى المخزون.
     *
     * الواجهة ترسل received_quantity كإجمالي مستلم تراكمي لكل صنف.
     * لذلك نحسب:
     * delta = new_received_quantity - old_received_quantity
     *
     * ولا نزيد المخزون إلا بقيمة delta.
     */
    public function receive(
        Request $request,
        PurchaseOrder $purchaseOrder
    ) {
        if ($purchaseOrder->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن استلام أوامر الشراء المعتمدة فقط.',
            ], 422);
        }

        $validated = $request->validate([
            'items' => [
                'required',
                'array',
                'min:1',
            ],
            'items.*.item_id' => [
                'required',
                'integer',
                'exists:purchase_order_items,id',
            ],
            'items.*.received_quantity' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        DB::transaction(function () use (
            $request,
            $purchaseOrder,
            $validated
        ) {
            foreach ($validated['items'] as $receivedItem) {
                $item = $purchaseOrder
                    ->items()
                    ->where('id', $receivedItem['item_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $newReceivedQuantity =
                    (float) $receivedItem[
                        'received_quantity'
                    ];

                $oldReceivedQuantity =
                    (float) $item->received_quantity;

                $orderedQuantity =
                    (float) $item->quantity;

                if (
                    $newReceivedQuantity >
                    $orderedQuantity
                ) {
                    throw ValidationException::withMessages([
                        'items' =>
                            'الكمية المستلمة لا يمكن أن تتجاوز الكمية المطلوبة.',
                    ]);
                }

                if (
                    $newReceivedQuantity <
                    $oldReceivedQuantity
                ) {
                    throw ValidationException::withMessages([
                        'items' =>
                            'لا يمكن تقليل الكمية المستلمة سابقًا من شاشة الاستلام.',
                    ]);
                }

                $delta =
                    $newReceivedQuantity -
                    $oldReceivedQuantity;

                if ($delta <= 0) {
                    continue;
                }

                if (!$item->product_id) {
                    throw ValidationException::withMessages([
                        'items' =>
                            'يوجد صنف غير مرتبط بمنتج في المخزون.',
                    ]);
                }

                $product = Product::query()
                    ->whereKey($item->product_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $stockBefore =
                    (float) $product->stock_quantity;

                $stockAfter =
                    $stockBefore + $delta;

                $product->update([
                    'stock_quantity' =>
                        round($stockAfter, 2),
                ]);

                $item->update([
                    'received_quantity' =>
                        round(
                            $newReceivedQuantity,
                            2
                        ),
                ]);

                InventoryTransaction::create([
                    'product_id' =>
                        $product->id,
                    'project_id' =>
                        $purchaseOrder->project_id,
                    'purchase_order_id' =>
                        $purchaseOrder->id,
                    'purchase_order_item_id' =>
                        $item->id,
                    'type' =>
                        'IN',
                    'quantity' =>
                        round($delta, 2),
                    'unit_cost' =>
                        (float) $item->unit_cost,
                    'stock_before' =>
                        round($stockBefore, 2),
                    'stock_after' =>
                        round($stockAfter, 2),
                    'reference' =>
                        $purchaseOrder->po_number,
                    'notes' =>
                        'استلام مشتريات من أمر الشراء ' .
                        $purchaseOrder->po_number,
                    'created_by' =>
                        $request->user()?->id,
                ]);
            }

            $purchaseOrder->refresh();

            $items =
                $purchaseOrder
                    ->items()
                    ->get();

            $allItemsReceived =
                $items->isNotEmpty() &&
                $items->every(function ($item) {
                    return
                        (float) $item->received_quantity >=
                        (float) $item->quantity;
                });

            if ($allItemsReceived) {
                $purchaseOrder->update([
                    'status' =>
                        'completed',
                    'actual_delivery_date' =>
                        now()->toDateString(),
                ]);
            }
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
                $purchaseOrder->status === 'completed'
                    ? 'تم استلام أمر الشراء بالكامل وتحديث المخزون.'
                    : 'تم تسجيل الاستلام الجزئي وتحديث المخزون.',
            'data' => $purchaseOrder,
        ]);
    }
}
