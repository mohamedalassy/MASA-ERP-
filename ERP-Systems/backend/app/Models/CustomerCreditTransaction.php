<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerCreditTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_credit_profile_id',
        'type',
        'reference_type',
        'reference_id',
        'amount',
        'balance_after',
        'transaction_date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'transaction_date' => 'date',
    ];

    public function profile()
    {
        return $this->belongsTo(CustomerCreditProfile::class, 'customer_credit_profile_id');
    }
}
