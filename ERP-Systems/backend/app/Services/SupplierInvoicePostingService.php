<?php

namespace App\Services;

use App\Models\FinanceAccount;
use App\Models\FinanceJournalEntry;
use App\Models\SupplierInvoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierInvoicePostingService
{
    public function post(SupplierInvoice $invoice, ?int $userId = null): FinanceJournalEntry
    {
        return DB::transaction(function () use ($invoice, $userId) {
            $invoice = SupplierInvoice::query()->whereKey($invoice->id)->lockForUpdate()->firstOrFail();

            if (in_array($invoice->status, ['posted', 'partially_paid', 'paid'], true)) {
                $existing = FinanceJournalEntry::query()
                    ->where('reference_type', 'supplier_invoice')
                    ->where('reference_id', $invoice->id)
                    ->first();

                if ($existing) {
                    return $existing->load('lines.account');
                }
            }

            if ($invoice->status !== 'approved') {
                throw ValidationException::withMessages([
                    'status' => ['يجب اعتماد فاتورة المورد قبل ترحيلها محاسبيًا.'],
                ]);
            }

            if ($invoice->match_status !== 'matched') {
                throw ValidationException::withMessages([
                    'match_status' => ['لا يمكن ترحيل فاتورة المورد قبل اكتمال المطابقة بدون فروقات.'],
                ]);
            }

            $expenseAccount = $this->resolveAccount(['5110', '5100'], 'expense');
            $payableAccount = $this->resolveAccount(['2110', '2100'], 'liability');
            $inputVatAccount = $this->resolveAccount(['1130', '1140'], 'asset', true);

            $total = round((float) $invoice->total, 2);
            $tax = round((float) $invoice->tax, 2);
            $net = round($total - $tax, 2);

            if ($total <= 0 || $net < 0) {
                throw ValidationException::withMessages([
                    'accounting' => ['إجمالي فاتورة المورد غير صالح للترحيل.'],
                ]);
            }

            if ($tax > 0 && !$inputVatAccount) {
                throw ValidationException::withMessages([
                    'accounting' => ['حساب ضريبة المدخلات غير موجود أو غير قابل للترحيل.'],
                ]);
            }

            $entry = FinanceJournalEntry::create([
                'entry_number' => $this->generateJournalNumber(),
                'entry_date' => $invoice->invoice_date,
                'description' => 'ترحيل فاتورة مورد ' . $invoice->invoice_number,
                'reference_type' => 'supplier_invoice',
                'reference_id' => $invoice->id,
                'reference_number' => $invoice->supplier_invoice_number,
                'project_id' => $invoice->project_id,
                'status' => 'posted',
                'total_debit' => $total,
                'total_credit' => $total,
                'created_by' => $userId,
                'approved_by' => $userId,
                'approved_at' => now(),
                'posted_by' => $userId,
                'posted_at' => now(),
                'notes' => 'قيد آلي ناتج عن ترحيل فاتورة المورد.',
            ]);

            $lines = [[
                'account_id' => $expenseAccount->id,
                'project_id' => $invoice->project_id,
                'description' => 'تكلفة/مشتريات - ' . $invoice->invoice_number,
                'debit' => $net,
                'credit' => 0,
            ]];

            if ($tax > 0) {
                $lines[] = [
                    'account_id' => $inputVatAccount->id,
                    'project_id' => $invoice->project_id,
                    'description' => 'ضريبة مدخلات - ' . $invoice->invoice_number,
                    'debit' => $tax,
                    'credit' => 0,
                ];
            }

            $lines[] = [
                'account_id' => $payableAccount->id,
                'project_id' => $invoice->project_id,
                'description' => 'ذمم المورد - ' . $invoice->invoice_number,
                'debit' => 0,
                'credit' => $total,
            ];

            $entry->lines()->createMany($lines);

            $invoice->update([
                'status' => 'posted',
                'posted_at' => now(),
                'remaining_amount' => max(0, $total - (float) $invoice->paid_amount),
            ]);

            return $entry->load('lines.account');
        });
    }

    private function resolveAccount(array $codes, string $type, bool $nullable = false): ?FinanceAccount
    {
        $account = FinanceAccount::query()
            ->whereIn('code', $codes)
            ->where('type', $type)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderByRaw('CASE WHEN code = ? THEN 0 ELSE 1 END', [$codes[0]])
            ->first();

        if (!$account && !$nullable) {
            throw ValidationException::withMessages([
                'accounting' => ['حساب محاسبي مطلوب غير موجود أو غير قابل للترحيل: ' . implode(' / ', $codes)],
            ]);
        }

        return $account;
    }

    private function generateJournalNumber(): string
    {
        $nextId = (int) (FinanceJournalEntry::query()->max('id') ?? 0) + 1;
        return 'JE-' . now()->format('Y') . '-' . str_pad((string) $nextId, 6, '0', STR_PAD_LEFT);
    }
}
