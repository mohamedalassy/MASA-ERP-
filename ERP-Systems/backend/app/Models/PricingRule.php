<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PricingRule extends Model
{
    protected $fillable = [
        'name',
        'scope_type',
        'scope_id',
        'minimum_margin_percent',
        'target_margin_percent',
        'default_markup_percent',
        'maximum_discount_percent',
        'block_below_minimum_margin',
        'require_approval_below_target',
        'is_active',
        'priority',
        'created_by',
    ];

    protected $casts = [
        'minimum_margin_percent' => 'decimal:2',
        'target_margin_percent' => 'decimal:2',
        'default_markup_percent' => 'decimal:2',
        'maximum_discount_percent' => 'decimal:2',
        'block_below_minimum_margin' => 'boolean',
        'require_approval_below_target' => 'boolean',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
