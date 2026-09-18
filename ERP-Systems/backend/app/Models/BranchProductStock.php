<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BranchProductStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'product_id',
        'stock_quantity',
        'reserved_quantity',
        'average_cost',
        'minimum_stock',
        'maximum_stock',
        'reorder_point',
    ];

    protected $casts = [
        'stock_quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'minimum_stock' => 'decimal:2',
        'maximum_stock' => 'decimal:2',
        'reorder_point' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function getAvailableQuantityAttribute(): float
    {
        return max(
            0,
            (float) $this->stock_quantity - (float) $this->reserved_quantity
        );
    }
}
