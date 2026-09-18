<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Services\Sales\BranchStockReceiptService;
use Illuminate\Http\Request;

class BranchPurchaseReceiptController extends Controller
{
    public function receive(
        Request $request,
        PurchaseOrder $purchaseOrder,
        BranchStockReceiptService $service
    ) {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
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

        $result = $service->receive(
            $purchaseOrder,
            $validated['items'],
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم استلام المشتريات وتحديث مخزون الفرع.',
            'data' => $result,
        ]);
    }
}
