<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesNegotiation extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'opportunity_id',
        'quotation_id',
        'customer_id',
        'type',
        'subject',
        'details',
        'requested_value',
        'approved_value',
        'status',
        'requested_by',
        'approved_by',
        'requested_at',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'requested_value' => 'decimal:2',
        'approved_value' => 'decimal:2',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function opportunity()
    {
        return $this->belongsTo(SalesOpportunity::class);
    }

    public function quotation()
    {
        return $this->belongsTo(ProjectQuotation::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
