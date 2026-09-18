<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesTarget extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'user_id',
        'period_type',
        'period_start',
        'period_end',
        'target_amount',
        'target_margin',
        'target_deals',
        'status',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'target_amount' => 'decimal:2',
        'target_margin' => 'decimal:2',
        'target_deals' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
