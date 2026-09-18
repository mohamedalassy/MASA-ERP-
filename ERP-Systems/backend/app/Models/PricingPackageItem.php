<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingPackageItem extends Model
{
    protected $fillable = [
        'pricing_package_id',
        'product_id',
        'product_name_snapshot',
        'sku_snapshot',
        'unit',
        'quantity',
        'cost_price',
        'sale_price',
        'discount_percent',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'sort_order' => 'integer',
    ];

    public function pricingPackage()
    {
        return $this->belongsTo(PricingPackage::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
