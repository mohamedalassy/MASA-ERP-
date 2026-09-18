<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesDeliveryItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_delivery_id',
        'sales_order_item_id',
        'product_id',
        'quantity',
        'unit_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
    ];

    public function delivery()
    {
        return $this->belongsTo(SalesDelivery::class, 'sales_delivery_id');
    }

    public function salesOrderItem()
    {
        return $this->belongsTo(SalesOrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
