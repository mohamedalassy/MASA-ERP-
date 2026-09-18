<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'opportunity_id',
        'project_id',
        'quotation_id',
        'order_number',
        'status',
        'subtotal',
        'discount',
        'tax',
        'total',
        'order_date',
        'expected_delivery_date',
        'payment_terms',
        'currency',
        'created_by',
        'confirmed_by',
        'confirmed_at',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total' => 'decimal:2',
        'order_date' => 'date',
        'expected_delivery_date' => 'date',
        'confirmed_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function opportunity()
    {
        return $this->belongsTo(SalesOpportunity::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function quotation()
    {
        return $this->belongsTo(ProjectQuotation::class);
    }

    public function items()
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function shortages()
    {
        return $this->hasMany(SalesOrderStockShortage::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function confirmer()
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function contracts()
    {
        return $this->hasMany(SalesContract::class);
    }
}
