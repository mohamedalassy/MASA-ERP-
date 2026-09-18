<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesDelivery;
use App\Models\SalesOrder;
use App\Services\Sales\SalesDeliveryService;
use Illuminate\Http\Request;

class SalesDeliveryController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesDelivery::query()
            ->with([
                'branch:id,code,name',
                'salesOrder:id,order_number,status,total',
                'project:id,project_code,name',
                'deliveredBy:id,name',
            ])
            ->latest('id');

        foreach (['branch_id', 'sales_order_id', 'project_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function show(SalesDelivery $delivery)
    {
        return response()->json([
            'success' => true,
            'data' => $delivery->load([
                'items.product',
                'salesOrder.customer',
                'project',
                'deliveredBy',
            ]),
        ]);
    }

    public function store(
        Request $request,
        SalesOrder $salesOrder,
        SalesDeliveryService $service
    ) {
        $validated = $request->validate([
            'delivery_date' => ['nullable', 'date'],
            'received_by_name' => ['nullable', 'string', 'max:255'],
            'received_by_phone' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.sales_order_item_id' => [
                'required',
                'integer',
                'exists:sales_order_items,id',
            ],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
        ]);

        $delivery = $service->deliver(
            $salesOrder,
            $validated,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل التسليم وصرف المخزون.',
            'data' => $delivery,
        ], 201);
    }
}
