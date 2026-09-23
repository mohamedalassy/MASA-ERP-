<?php

namespace App\Services;

use App\Models\FinanceAccount;
use App\Models\FinanceJournalEntry;
use App\Models\SupplierInvoice;
use App\Models\SupplierInvoicePayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierInvoicePaymentService
{
    public function record(SupplierInvoice $supplierInvoice, array $data, ?int $userId = null): SupplierInvoicePayment
    {
        return DB::transaction(function () use ($supplierInvoice, $data, $userId) {
            $invoice = SupplierInvoice::query()->whereKey($supplierInvoice->id)->lockForUpdate()->firstOrFail();

            if (!in_array($invoice->status, ['posted', 'partially_paid'], true)) {
                throw ValidationException::withMessages([
                    'status' => ['يجب ترحيل فاتورة المورد قبل تسجيل الدفعة.'],
                ]);
            }

            $remaining = round((float) $invoice->remaining_amount, 2);
            $amount = round((float) $data['amount'], 2);

            if ($remaining <= 0.009) {
                throw ValidationException::withMessages(['amount' => ['فاتورة المورد مدفوعة بالكامل.']]);
            }

            if ($amount <= 0 || $amount > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => ['مبلغ الدفعة يتجاوز الرصيد المتبقي على فاتورة المورد.'],
                ]);
            }

            $cashAccount = FinanceAccount::query()
                ->whereKey($data['finance_account_id'])
                ->where('is_active', true)
                ->where('is_postable', true)
                ->where('is_cash_account', true)
                ->first();

            if (!$cashAccount) {
                throw ValidationException::withMessages([
                    'finance_account_id' => ['الحساب المختار ليس بنكًا أو صندوقًا فعالًا.'],
                ]);
            }

            $payableAccount = FinanceAccount::query()
                ->whereIn('code', ['2110', '2100'])
                ->where('type', 'liability')
                ->where('is_active', true)
                ->where('is_postable', true)
                ->first();

            if (!$payableAccount) {
                throw ValidationException::withMessages([
                    'accounting' => ['حساب ذمم الموردين غير موجود أو غير قابل للترحيل.'],
                ]);
            }

            if (!empty($data['reference_number'])) {
                $duplicate = SupplierInvoicePayment::query()
                    ->where('supplier_invoice_id', $invoice->id)
                    ->where('reference_number', $data['reference_number'])
                    ->exists();

                if ($duplicate) {
                    throw ValidationException::withMessages([
                        'reference_number' => ['تم استخدام مرجع الدفعة نفسه لهذه الفاتورة من قبل.'],
                    ]);
                }
            }

            $paymentNumber = $this->generatePaymentNumber();

            $entry = FinanceJournalEntry::create([
                'entry_number' => $this->generateJournalNumber(),
                'entry_date' => $data['payment_date'],
                'description' => 'سداد فاتورة مورد ' . $invoice->invoice_number,
                'reference_type' => 'supplier_payment',
                'reference_id' => $invoice->id,
                'reference_number' => $paymentNumber,
                'project_id' => $invoice->project_id,
                'status' => 'posted',
                'total_debit' => $amount,
                'total_credit' => $amount,
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now(),
                'posted_by' => $userId,
                'posted_at' => now(),
                'notes' => 'قيد آلي ناتج عن سداد فاتورة مورد.',
            ]);

            $entry->lines()->createMany([
                [
                    'account_id' => $payableAccount->id,
                    'project_id' => $invoice->project_id,
                    'description' => 'تخفيض ذمم المورد - ' . $invoice->invoice_number,
                    'debit' => $amount,
                    'credit' => 0,
                ],
                [
                    'account_id' => $cashAccount->id,
                    'project_id' => $invoice->project_id,
                    'description' => 'سداد ' . $invoice->invoice_number,
                    'debit' => 0,
                    'credit' => $amount,
                ],
            ]);

            $payment = SupplierInvoicePayment::create([
                'supplier_invoice_id' => $invoice->id,
                'project_id' => $invoice->project_id,
                'finance_account_id' => $cashAccount->id,
                'finance_journal_entry_id' => $entry->id,
                'payment_number' => $paymentNumber,
                'amount' => $amount,
                'payment_date' => $data['payment_date'],
                'payment_method' => $data['payment_method'] ?? null,
                'reference_number' => $data['reference_number'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            $paidAfter = round((float) $invoice->paid_amount + $amount, 2);
            $remainingAfter = round(max(0, (float) $invoice->total - $paidAfter), 2);

            $invoice->update([
                'paid_amount' => $paidAfter,
                'remaining_amount' => $remainingAfter,
                'status' => $remainingAfter <= 0.009 ? 'paid' : 'partially_paid',
            ]);

            return $payment->load(['financeAccount', 'journalEntry.lines.account']);
        });
    }

    private function generateJournalNumber(): string
    {
        $nextId = (int) (FinanceJournalEntry::query()->max('id') ?? 0) + 1;
        return 'JE-' . now()->format('Y') . '-' . str_pad((string) $nextId, 6, '0', STR_PAD_LEFT);
    }

    private function generatePaymentNumber(): string
    {
        $nextId = (int) (SupplierInvoicePayment::query()->max('id') ?? 0) + 1;
        return 'PAY-' . now()->format('Y') . '-' . str_pad((string) $nextId, 6, '0', STR_PAD_LEFT);
    }
}
