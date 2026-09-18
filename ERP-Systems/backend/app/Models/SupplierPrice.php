<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierPrice extends Model
{
    protected $fillable = [
        'product_id',
        'supplier_id',
        'unit_price',
        'currency',
        'minimum_order_quantity',
        'lead_time_days',
        'valid_from',
        'valid_until',
        'payment_terms',
        'warranty_terms',
        'notes',
        'is_preferred',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'minimum_order_quantity' => 'decimal:2',
        'lead_time_days' => 'integer',
        'valid_from' => 'date:Y-m-d',
        'valid_until' => 'date:Y-m-d',
        'is_preferred' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function histories()
    {
        return $this->hasMany(SupplierPriceHistory::class);
    }
}
