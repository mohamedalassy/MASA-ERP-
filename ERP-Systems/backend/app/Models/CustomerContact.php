<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'name',
        'job_title',
        'department',
        'phone',
        'mobile',
        'email',
        'role',
        'influence_level',
        'is_primary',
        'is_decision_maker',
        'notes',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_decision_maker' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
