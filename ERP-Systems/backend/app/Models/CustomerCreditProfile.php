<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerCreditProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'credit_limit',
        'used_credit',
        'available_credit',
        'overdue_amount',
        'average_delay_days',
        'risk_status',
        'is_blocked',
        'reviewed_by',
        'reviewed_at',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'used_credit' => 'decimal:2',
        'available_credit' => 'decimal:2',
        'overdue_amount' => 'decimal:2',
        'average_delay_days' => 'integer',
        'is_blocked' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function transactions() { return $this->hasMany(CustomerCreditTransaction::class); }
}
