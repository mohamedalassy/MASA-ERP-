<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductAlternative extends Model
{
    protected $fillable = [
        'product_id',
        'alternative_product_id',
        'priority',
        'is_preferred',
        'is_active',
        'reason',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'priority' => 'integer',
        'is_preferred' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function alternativeProduct()
    {
        return $this->belongsTo(
            Product::class,
            'alternative_product_id'
        );
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
