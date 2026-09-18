<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierPriceHistory extends Model
{
    protected $fillable = [
        'supplier_price_id',
        'product_id',
        'supplier_id',
        'old_price',
        'new_price',
        'currency',
        'old_lead_time_days',
        'new_lead_time_days',
        'old_valid_until',
        'new_valid_until',
        'change_type',
        'changed_by',
    ];

    protected $casts = [
        'old_price' => 'decimal:2',
        'new_price' => 'decimal:2',
        'old_lead_time_days' => 'integer',
        'new_lead_time_days' => 'integer',
        'old_valid_until' => 'date:Y-m-d',
        'new_valid_until' => 'date:Y-m-d',
    ];

    public function supplierPrice()
    {
        return $this->belongsTo(SupplierPrice::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function changer()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
