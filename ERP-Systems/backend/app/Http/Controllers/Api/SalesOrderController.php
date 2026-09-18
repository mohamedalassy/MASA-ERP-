<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectQuotation;
use App\Models\SalesOrder;
use App\Services\Sales\QuotationToSalesOrderService;
use App\Services\Sales\SalesOrderProcurementService;
use App\Services\Sales\SalesOrderReservationService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrder::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'project:id,project_code,name,current_stage',
                'quotation:id,quotation_number,version,status,total',
                'opportunity:id,opportunity_number,name',
            ])
            ->latest('id');

        foreach (['branch_id', 'customer_id', 'project_id', 'quotation_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) =>
                        $c->where('name', 'like', "%{$search}%")
                    )
                    ->orWhereHas('project', fn ($p) =>
                        $p->where('name', 'like', "%{$search}%")
                    );
            });
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function show(SalesOrder $salesOrder)
    {
        $salesOrder->load([
            'branch',
            'customer',
            'opportunity',
            'project',
            'quotation',
            'items.product',
            'shortages.product',
            'shortages.purchaseOrder',
            'creator',
            'confirmer',
            'contracts',
        ]);

        return response()->json([
            'success' => true,
            'data' => $salesOrder,
        ]);
    }

    public function fromQuotation(
        Request $request,
        ProjectQuotation $quotation,
        QuotationToSalesOrderService $service
    ) {
        $order = $service->convert(
            $quotation,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء Sales Order من عرض السعر.',
            'data' => $order,
        ], 201);
    }

    public function confirm(
        Request $request,
        SalesOrder $salesOrder,
        SalesOrderReservationService $service
    ) {
        $order = $service->confirmAndReserve(
            $salesOrder,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => $order->status === 'confirmed_with_shortage'
                ? 'تم تأكيد Sales Order مع وجود نواقص تحتاج شراء.'
                : 'تم تأكيد Sales Order وحجز المخزون بالكامل.',
            'data' => $order,
        ]);
    }

    public function cancel(
        SalesOrder $salesOrder,
        SalesOrderReservationService $service
    ) {
        if (in_array($salesOrder->status, ['cancelled', 'completed'], true)) {
            throw ValidationException::withMessages([
                'sales_order' => 'لا يمكن إلغاء Sales Order في حالته الحالية.',
            ]);
        }

        $service->release($salesOrder);

        $salesOrder->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء Sales Order وفك حجز المخزون.',
            'data' => $salesOrder->fresh(['items', 'shortages']),
        ]);
    }

    public function createPurchaseOrder(
        Request $request,
        SalesOrder $salesOrder,
        SalesOrderProcurementService $service
    ) {
        $validated = $request->validate([
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
        ]);

        $purchaseOrder = $service->createPurchaseOrder(
            $salesOrder,
            $validated['supplier_id'],
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء أمر شراء للنواقص.',
            'data' => $purchaseOrder,
        ], 201);
    }
}
