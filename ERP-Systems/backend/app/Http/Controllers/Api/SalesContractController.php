<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesContract;
use App\Models\SalesOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SalesContractController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesContract::query()
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

    public function show(SalesContract $contract)
    {
        $contract->load([
            'branch',
            'customer',
            'salesOrder.items.product',
            'project',
            'items.product',
            'creator',
            'approver',
        ]);

        return response()->json([
            'success' => true,
            'data' => $contract,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $contract = DB::transaction(function () use ($validated, $request) {
            $contract = SalesContract::create([
                ...$validated,
                'contract_number' => $validated['contract_number']
                    ?? $this->nextContractNumber(),
                'created_by' => $request->user()?->id,
            ]);

            return $contract;
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء العقد.',
            'data' => $contract->fresh(),
        ], 201);
    }

    public function fromSalesOrder(Request $request, SalesOrder $salesOrder)
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'max:100'],
            'title' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'payment_terms' => ['nullable', 'string'],
            'renewal_notice_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'auto_renew' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $salesOrder->loadMissing('items');

        $contract = DB::transaction(function () use ($salesOrder, $validated, $request) {
            $contract = SalesContract::create([
                'branch_id' => $salesOrder->branch_id,
                'customer_id' => $salesOrder->customer_id,
                'sales_order_id' => $salesOrder->id,
                'project_id' => $salesOrder->project_id,
                'contract_number' => $this->nextContractNumber(),
                'type' => $validated['type'],
                'status' => 'draft',
                'title' => $validated['title'] ?? $salesOrder->order_number,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'] ?? null,
                'value' => $salesOrder->total,
                'payment_terms' => $validated['payment_terms']
                    ?? $salesOrder->payment_terms,
                'renewal_notice_days' => $validated['renewal_notice_days'] ?? 60,
                'auto_renew' => $validated['auto_renew'] ?? false,
                'created_by' => $request->user()?->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($salesOrder->items as $item) {
                $contract->items()->create([
                    'product_id' => $item->product_id,
                    'description' => $item->product_name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'line_total' => $item->line_total,
                    'service_start_date' => $validated['start_date'],
                    'service_end_date' => $validated['end_date'] ?? null,
                ]);
            }

            return $contract;
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء العقد من Sales Order.',
            'data' => $contract->fresh(['items.product', 'salesOrder', 'customer']),
        ], 201);
    }

    public function approve(Request $request, SalesContract $contract)
    {
        $contract->update([
            'status' => 'active',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم اعتماد العقد.',
            'data' => $contract->fresh(['approver']),
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'sales_order_id' => ['nullable', 'integer', 'exists:sales_orders,id'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'contract_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('sales_contracts', 'contract_number'),
            ],
            'type' => ['required', 'string', 'max:100'],
            'status' => ['nullable', 'in:draft,active,on_hold,expired,cancelled,completed'],
            'title' => ['nullable', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'value' => ['nullable', 'numeric', 'min:0'],
            'payment_terms' => ['nullable', 'string'],
            'renewal_notice_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'auto_renew' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);
    }

    private function nextContractNumber(): string
    {
        return 'CT-' . now()->format('Y') . '-' .
            str_pad((string) ((SalesContract::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);
    }
}
