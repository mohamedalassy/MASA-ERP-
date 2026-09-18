<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesRenewal extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'sales_contract_id',
        'opportunity_id',
        'renewal_number',
        'status',
        'renewal_value',
        'expiry_date',
        'reminder_date',
        'probability',
        'owner_id',
        'created_by',
        'converted_at',
        'notes',
    ];

    protected $casts = [
        'renewal_value' => 'decimal:2',
        'expiry_date' => 'date',
        'reminder_date' => 'date',
        'probability' => 'integer',
        'converted_at' => 'datetime',
    ];

    public function branch() { return $this->belongsTo(Branch::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function contract() { return $this->belongsTo(SalesContract::class, 'sales_contract_id'); }
    public function opportunity() { return $this->belongsTo(SalesOpportunity::class); }
    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
