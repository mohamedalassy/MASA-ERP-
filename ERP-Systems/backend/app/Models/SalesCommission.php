<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesCommission extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'user_id',
        'sales_order_id',
        'sales_invoice_id',
        'period_start',
        'period_end',
        'basis',
        'eligible_amount',
        'rate',
        'commission_amount',
        'status',
        'approved_by',
        'approved_at',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'eligible_amount' => 'decimal:2',
        'rate' => 'decimal:4',
        'commission_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function salesOrder() { return $this->belongsTo(SalesOrder::class); }
    public function salesInvoice() { return $this->belongsTo(SalesInvoice::class); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
}
