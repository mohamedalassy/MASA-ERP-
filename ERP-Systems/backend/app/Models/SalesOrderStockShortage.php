<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrderStockShortage extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'sales_order_id',
        'sales_order_item_id',
        'product_id',
        'required_quantity',
        'available_quantity',
        'shortage_quantity',
        'status',
        'purchase_order_id',
        'notes',
    ];

    protected $casts = [
        'required_quantity' => 'decimal:2',
        'available_quantity' => 'decimal:2',
        'shortage_quantity' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function salesOrderItem()
    {
        return $this->belongsTo(SalesOrderItem::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
