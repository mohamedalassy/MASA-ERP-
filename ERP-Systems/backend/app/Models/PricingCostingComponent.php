<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingCostingComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'pricing_costing_id',
        'type',
        'label',
        'calculation_mode',
        'percentage_basis',
        'fixed_amount',
        'percentage',
        'sort_order',
        'notes',
    ];

    protected $casts = [
        'fixed_amount' => 'decimal:2',
        'percentage' => 'decimal:4',
    ];

    public function costing()
    {
        return $this->belongsTo(PricingCosting::class, 'pricing_costing_id');
    }
}
