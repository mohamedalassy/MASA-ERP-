<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\SalesOrder;
use App\Services\Sales\SalesFinanceService;
use Illuminate\Http\Request;

class SalesInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesInvoice::query()
            ->with([
                'branch:id,code,name',
                'customer:id,code,name',
                'salesOrder:id,order_number,status,total',
                'project:id,project_code,name',
            ])
            ->latest('id');

        foreach (['branch_id', 'customer_id', 'sales_order_id', 'project_id'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->integer($field));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(250)->get(),
        ]);
    }

    public function show(SalesInvoice $invoice)
    {
        return response()->json([
            'success' => true,
            'data' => $invoice->load([
                'branch',
                'customer',
                'salesOrder',
                'project',
                'items.product',
                'payments',
                'creator',
                'poster',
            ]),
        ]);
    }

    public function fromSalesOrder(
        Request $request,
        SalesOrder $salesOrder,
        SalesFinanceService $service
    ) {
        $validated = $request->validate([
            'invoice_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $invoice = $service->createInvoice(
            $salesOrder,
            $validated,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الفاتورة من Sales Order.',
            'data' => $invoice,
        ], 201);
    }

    public function post(
        Request $request,
        SalesInvoice $invoice,
        SalesFinanceService $service
    ) {
        $invoice = $service->postInvoice(
            $invoice,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم ترحيل الفاتورة إلى المالية.',
            'data' => $invoice,
        ]);
    }

    public function collect(
        Request $request,
        SalesInvoice $invoice,
        SalesFinanceService $service
    ) {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'gt:0'],
            'payment_date' => ['nullable', 'date'],
            'payment_method' => ['nullable', 'string', 'max:100'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $payment = $service->collect(
            $invoice,
            $validated,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل التحصيل.',
            'data' => $payment,
        ], 201);
    }
}
