<?php

namespace App\Services\Sales;

use App\Models\ProjectFinancialTransaction;
use App\Models\SalesInvoice;
use App\Models\SalesOrder;
use App\Models\SalesPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesFinanceService
{
    public function createInvoice(
        SalesOrder $salesOrder,
        array $payload,
        ?int $actorId = null
    ): SalesInvoice {
        if (in_array($salesOrder->status, ['draft', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'sales_order' => 'لا يمكن إصدار فاتورة من Sales Order في حالته الحالية.',
            ]);
        }

        $existing = SalesInvoice::query()
            ->where('sales_order_id', $salesOrder->id)
            ->whereNotIn('status', ['cancelled'])
            ->first();

        if ($existing) {
            return $existing->load('items');
        }

        return DB::transaction(function () use ($salesOrder, $payload, $actorId) {
            $invoice = SalesInvoice::create([
                'branch_id' => $salesOrder->branch_id,
                'customer_id' => $salesOrder->customer_id,
                'sales_order_id' => $salesOrder->id,
                'project_id' => $salesOrder->project_id,
                'invoice_number' => $this->nextInvoiceNumber(),
                'status' => 'draft',
                'invoice_date' => $payload['invoice_date'] ?? now()->toDateString(),
                'due_date' => $payload['due_date'] ?? null,
                'subtotal' => $salesOrder->subtotal,
                'discount' => $salesOrder->discount,
                'tax' => $salesOrder->tax,
                'total' => $salesOrder->total,
                'paid_amount' => 0,
                'remaining_amount' => $salesOrder->total,
                'currency' => $salesOrder->currency,
                'payment_terms' => $salesOrder->payment_terms,
                'created_by' => $actorId,
                'notes' => $payload['notes'] ?? null,
            ]);

            foreach ($salesOrder->items as $item) {
                $invoice->items()->create([
                    'sales_order_item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'description' => $item->product_name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount' => $item->discount,
                    'tax_rate' => $item->tax_rate,
                    'tax_amount' => $item->tax_amount,
                    'line_total' => $item->line_total,
                ]);
            }

            return $invoice->fresh(['items.product', 'customer', 'salesOrder']);
        });
    }

    public function postInvoice(
        SalesInvoice $invoice,
        ?int $actorId = null
    ): SalesInvoice {
        if ($invoice->status !== 'draft') {
            throw ValidationException::withMessages([
                'invoice' => 'يمكن ترحيل الفاتورة المسودة فقط.',
            ]);
        }

        return DB::transaction(function () use ($invoice, $actorId) {
            $invoice->update([
                'status' => 'posted',
                'posted_by' => $actorId,
                'posted_at' => now(),
            ]);

            ProjectFinancialTransaction::create([
                'branch_id' => $invoice->branch_id,
                'project_id' => $invoice->project_id,
                'type' => 'sales_invoice',
                'direction' => 'in',
                'reference_number' => $invoice->invoice_number,
                'title' => 'Sales Invoice',
                'description' => "Invoice for Sales Order {$invoice->salesOrder?->order_number}",
                'subtotal' => $invoice->subtotal,
                'tax' => $invoice->tax,
                'total' => $invoice->total,
                'paid_amount' => 0,
                'remaining_amount' => $invoice->total,
                'status' => 'pending',
                'transaction_date' => $invoice->invoice_date,
                'due_date' => $invoice->due_date,
                'sales_order_id' => $invoice->sales_order_id,
                'sales_invoice_id' => $invoice->id,
                'created_by' => $actorId,
                'approved_by' => $actorId,
                'approved_at' => now(),
            ]);

            $invoice->salesOrder?->update([
                'status' => $invoice->salesOrder->status === 'delivered'
                    ? 'invoiced'
                    : $invoice->salesOrder->status,
            ]);

            return $invoice->fresh(['items', 'payments', 'poster']);
        });
    }

    public function collect(
        SalesInvoice $invoice,
        array $payload,
        ?int $actorId = null
    ): SalesPayment {
        if (!in_array($invoice->status, ['posted', 'partially_paid'], true)) {
            throw ValidationException::withMessages([
                'invoice' => 'الفاتورة غير جاهزة للتحصيل.',
            ]);
        }

        $amount = (float) $payload['amount'];

        if ($amount <= 0 || $amount > (float) $invoice->remaining_amount) {
            throw ValidationException::withMessages([
                'amount' => 'قيمة التحصيل غير صحيحة.',
            ]);
        }

        return DB::transaction(function () use ($invoice, $payload, $actorId, $amount) {
            $payment = SalesPayment::create([
                'branch_id' => $invoice->branch_id,
                'customer_id' => $invoice->customer_id,
                'sales_invoice_id' => $invoice->id,
                'project_id' => $invoice->project_id,
                'payment_number' => $this->nextPaymentNumber(),
                'payment_date' => $payload['payment_date'] ?? now()->toDateString(),
                'amount' => $amount,
                'payment_method' => $payload['payment_method'] ?? null,
                'reference_number' => $payload['reference_number'] ?? null,
                'status' => 'posted',
                'created_by' => $actorId,
                'posted_by' => $actorId,
                'posted_at' => now(),
                'notes' => $payload['notes'] ?? null,
            ]);

            $newPaid = (float) $invoice->paid_amount + $amount;
            $remaining = max(0, (float) $invoice->total - $newPaid);

            $invoice->update([
                'paid_amount' => round($newPaid, 2),
                'remaining_amount' => round($remaining, 2),
                'status' => $remaining <= 0 ? 'paid' : 'partially_paid',
            ]);

            ProjectFinancialTransaction::create([
                'branch_id' => $invoice->branch_id,
                'project_id' => $invoice->project_id,
                'type' => 'sales_payment',
                'direction' => 'in',
                'reference_number' => $payment->payment_number,
                'title' => 'Customer Payment',
                'description' => "Payment against {$invoice->invoice_number}",
                'subtotal' => $amount,
                'tax' => 0,
                'total' => $amount,
                'paid_amount' => $amount,
                'remaining_amount' => $remaining,
                'status' => 'paid',
                'payment_method' => $payment->payment_method,
                'transaction_date' => $payment->payment_date,
                'paid_at' => now(),
                'sales_order_id' => $invoice->sales_order_id,
                'sales_invoice_id' => $invoice->id,
                'sales_payment_id' => $payment->id,
                'created_by' => $actorId,
                'approved_by' => $actorId,
                'approved_at' => now(),
            ]);

            if ($remaining <= 0) {
                $invoice->salesOrder?->update([
                    'status' => 'paid',
                ]);

                if ($invoice->project) {
                    $invoice->project->update([
                        'current_stage' => 'closed',
                        'status' => 'completed',
                    ]);
                }
            }

            return $payment->fresh(['invoice', 'customer', 'project']);
        });
    }

    private function nextInvoiceNumber(): string
    {
        return 'INV-' . now()->format('Y') . '-' .
            str_pad((string) ((SalesInvoice::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);
    }

    private function nextPaymentNumber(): string
    {
        return 'PAY-' . now()->format('Y') . '-' .
            str_pad((string) ((SalesPayment::max('id') ?? 0) + 1), 5, '0', STR_PAD_LEFT);
    }
}
