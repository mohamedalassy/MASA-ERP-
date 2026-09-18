<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingPackage extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'target_margin_percent',
        'discount_percent',
        'is_active',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'target_margin_percent' => 'decimal:2',
        'discount_percent' => 'decimal:2',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    public function items()
    {
        return $this->hasMany(PricingPackageItem::class)
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
