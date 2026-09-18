<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesForecastSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'snapshot_date',
        'period_start',
        'period_end',
        'committed_value',
        'likely_value',
        'upside_value',
        'pipeline_value',
        'weighted_pipeline',
        'target_value',
        'coverage_ratio',
        'created_by',
    ];

    protected $casts = [
        'snapshot_date' => 'date',
        'period_start' => 'date',
        'period_end' => 'date',
        'committed_value' => 'decimal:2',
        'likely_value' => 'decimal:2',
        'upside_value' => 'decimal:2',
        'pipeline_value' => 'decimal:2',
        'weighted_pipeline' => 'decimal:2',
        'target_value' => 'decimal:2',
        'coverage_ratio' => 'decimal:4',
    ];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
