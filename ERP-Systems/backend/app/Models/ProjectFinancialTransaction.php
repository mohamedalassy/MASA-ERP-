<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectFinancialTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'project_id',
        'type',
        'direction',
        'reference_number',
        'title',
        'description',
        'subtotal',
        'tax',
        'total',
        'paid_amount',
        'remaining_amount',
        'status',
        'payment_method',
        'transaction_date',
        'due_date',
        'paid_at',
        'quotation_id',
        'purchase_order_id',
        'sales_order_id',
        'sales_invoice_id',
        'sales_payment_id',
        'created_by',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'transaction_date' => 'date',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function quotation()
    {
        return $this->belongsTo(ProjectQuotation::class, 'quotation_id');
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function salesInvoice()
    {
        return $this->belongsTo(SalesInvoice::class);
    }

    public function salesPayment()
    {
        return $this->belongsTo(SalesPayment::class);
    }
}
