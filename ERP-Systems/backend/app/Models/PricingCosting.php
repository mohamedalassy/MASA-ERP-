<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingCosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'quotation_id',
        'title',
        'currency',
        'material_cost',
        'minimum_margin_percent',
        'target_margin_percent',
        'tax_rate',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'material_cost' => 'decimal:2',
        'minimum_margin_percent' => 'decimal:4',
        'target_margin_percent' => 'decimal:4',
        'tax_rate' => 'decimal:4',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function components()
    {
        return $this->hasMany(PricingCostingComponent::class)->orderBy('sort_order');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
