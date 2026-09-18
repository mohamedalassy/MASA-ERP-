<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryTransactionController extends Controller
{
    /**
     * عرض حركات المخزون
     */
    public function index(Request $request)
    {
        $query = InventoryTransaction::query()
            ->with([
                'product:id,sku,name,unit,stock_quantity',
                'project:id',
                'purchaseOrder:id,po_number',
                'purchaseOrderItem:id,product_name,sku',
            ])
            ->latest('id');

        if ($request->filled('product_id')) {
            $query->where(
                'product_id',
                $request->integer('product_id')
            );
        }

        if ($request->filled('project_id')) {
            $query->where(
                'project_id',
                $request->integer('project_id')
            );
        }

        if ($request->filled('purchase_order_id')) {
            $query->where(
                'purchase_order_id',
                $request->integer('purchase_order_id')
            );
        }

        if ($request->filled('type')) {
            $query->where(
                'type',
                $request->string('type')->toString()
            );
        }

        $transactions = $query
            ->limit(200)
            ->get();

        return response()->json([
            'success' => true,
            'count' => $transactions->count(),
            'data' => $transactions,
        ]);
    }

    /**
     * عرض سجل حركات منتج معين
     */
    public function productHistory(Product $product)
    {
        $transactions = $product
            ->inventoryTransactions()
            ->with([
                'project:id',
                'purchaseOrder:id,po_number',
            ])
            ->latest('id')
            ->limit(200)
            ->get();

        return response()->json([
            'success' => true,

            'product' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'stock_quantity' =>
                    $product->stock_quantity,
            ],

            'count' =>
                $transactions->count(),

            'data' =>
                $transactions,
        ]);
    }

    /**
     * صرف منتج من المخزون إلى مشروع
     */
    public function issueToProject(Request $request)
    {
        $validated = $request->validate([
            'project_id' => [
                'required',
                'integer',
                'exists:projects,id',
            ],

            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'quantity' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $result = DB::transaction(function () use (
            $validated,
            $request
        ) {
            $project = Project::query()
                ->lockForUpdate()
                ->findOrFail(
                    $validated['project_id']
                );

            $product = Product::query()
                ->lockForUpdate()
                ->findOrFail(
                    $validated['product_id']
                );

            $quantity = (float)
                $validated['quantity'];

            $stockBefore = (float)
                $product->stock_quantity;

            if ($quantity > $stockBefore) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        "الكمية المطلوبة للصرف ({$quantity}) أكبر من الرصيد المتاح ({$stockBefore}).",
                    ],
                ]);
            }

            $stockAfter =
                $stockBefore - $quantity;

            $product->update([
                'stock_quantity' =>
                    $stockAfter,
            ]);

            $reference =
                $validated['reference']
                ?? "PROJECT-{$project->id}";

            $transaction =
                InventoryTransaction::create([
                    'product_id' =>
                        $product->id,

                    'project_id' =>
                        $project->id,

                    'purchase_order_id' =>
                        null,

                    'purchase_order_item_id' =>
                        null,

                    'type' =>
                        'OUT',

                    'quantity' =>
                        $quantity,

                    'unit_cost' =>
                        $product->cost_price,

                    'stock_before' =>
                        $stockBefore,

                    'stock_after' =>
                        $stockAfter,

                    'reference' =>
                        $reference,

                    'notes' =>
                        $validated['notes']
                        ?? "صرف {$quantity} من {$product->name} للمشروع رقم {$project->id}",

                    'created_by' =>
                        auth()->id(),
                ]);

            return [
                'project' => $project,
                'product' => $product->fresh(),
                'transaction' =>
                    $transaction->load([
                        'product',
                        'project',
                    ]),
            ];
        });

        return response()->json([
            'success' => true,

            'message' =>
                'تم صرف المنتج للمشروع وتحديث المخزون بنجاح.',

            'data' => $result,
        ]);
    }
}