<?php

namespace App\Services\Sales;

use App\Models\Customer;
use App\Models\ProjectQuotation;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class QuotationToSalesOrderService
{
    public function convert(
        ProjectQuotation $quotation,
        ?int $actorId = null
    ): SalesOrder {
        $quotation->loadMissing(['project', 'items']);

        if ($quotation->status !== 'approved') {
            throw ValidationException::withMessages([
                'quotation' => 'يمكن إنشاء Sales Order من عرض سعر معتمد فقط.',
            ]);
        }

        $existing = SalesOrder::query()
            ->where('quotation_id', $quotation->id)
            ->first();

        if ($existing) {
            return $existing->load(['items', 'customer', 'project', 'quotation']);
        }

        $project = $quotation->project;

        if (!$project) {
            throw ValidationException::withMessages([
                'quotation' => 'عرض السعر غير مرتبط بمشروع.',
            ]);
        }

        return DB::transaction(function () use ($quotation, $project, $actorId) {
            $customer = $project->customer;

            if (!$customer) {
                $customer = Customer::create([
                    'branch_id' => $project->branch_id,
                    'code' => 'CUS-' . now()->format('ymdHis') . '-' . random_int(100, 999),
                    'name' => $project->customer_name ?: $project->name,
                    'phone' => $project->phone,
                    'email' => $project->email,
                    'commercial_register' => $project->commercial_register,
                    'tax_number' => $project->tax_number,
                    'address' => $project->address,
                    'status' => 'active',
                    'created_by' => $actorId,
                ]);

                $project->update([
                    'customer_id' => $customer->id,
                ]);
            }

            $order = SalesOrder::create([
                'branch_id' => $project->branch_id,
                'customer_id' => $customer->id,
                'project_id' => $project->id,
                'quotation_id' => $quotation->id,
                'order_number' => $this->nextOrderNumber(),
                'status' => 'draft',
                'subtotal' => $quotation->subtotal,
                'discount' => $quotation->discount,
                'tax' => $quotation->tax,
                'total' => $quotation->total,
                'order_date' => now()->toDateString(),
                'payment_terms' => data_get($quotation->commercial_terms, 'payment_terms'),
                'currency' => 'SAR',
                'created_by' => $actorId,
                'notes' => "Created from {$quotation->quotation_number} V{$quotation->version}",
            ]);

            foreach ($quotation->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'sku' => $item->sku,
                    'description' => $item->description,
                    'unit' => $item->unit,
                    'item_type' => $item->item_type ?: ($item->product_id ? 'inventory' : 'custom'),
                    'quantity' => $item->quantity,
                    'reserved_quantity' => 0,
                    'shortage_quantity' => 0,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->discount,
                    'tax_rate' => $item->tax_rate,
                    'tax_amount' => $item->tax_amount,
                    'line_total' => $item->line_total,
                    'sort_order' => $item->sort_order,
                ]);
            }

            return $order->fresh([
                'items.product',
                'customer',
                'project',
                'quotation',
            ]);
        });
    }

    private function nextOrderNumber(): string
    {
        return 'SO-' . now()->format('Y') . '-' .
            str_pad((string) ((SalesOrder::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);
    }
}
