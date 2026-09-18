<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesRevenueLeakage extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'sales_order_id',
        'sales_invoice_id',
        'sales_contract_id',
        'quotation_id',
        'source_type',
        'source_reference',
        'amount',
        'severity',
        'status',
        'detected_at',
        'resolved_at',
        'resolution_notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'detected_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function salesOrder() { return $this->belongsTo(SalesOrder::class); }
    public function salesInvoice() { return $this->belongsTo(SalesInvoice::class); }
    public function contract() { return $this->belongsTo(SalesContract::class, 'sales_contract_id'); }
    public function quotation() { return $this->belongsTo(ProjectQuotation::class, 'quotation_id'); }
}
