<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesDealHealthSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'opportunity_id',
        'snapshot_date',
        'score',
        'health',
        'risk_level',
        'days_since_activity',
        'stage_age_days',
        'margin_risk',
        'activity_risk',
        'close_date_risk',
        'notes',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'score' => 'integer',
        'days_since_activity' => 'integer',
        'stage_age_days' => 'integer',
        'margin_risk' => 'boolean',
        'activity_risk' => 'boolean',
        'close_date_risk' => 'boolean',
    ];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function opportunity() { return $this->belongsTo(SalesOpportunity::class); }
}
