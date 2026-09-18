<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'code',
        'name',
        'name_en',
        'type',
        'industry',
        'phone',
        'email',
        'website',
        'commercial_register',
        'tax_number',
        'credit_limit',
        'payment_terms_days',
        'address',
        'city',
        'region',
        'country',
        'status',
        'owner_id',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'credit_limit' => 'decimal:2',
        'payment_terms_days' => 'integer',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function contacts()
    {
        return $this->hasMany(CustomerContact::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function leads()
    {
        return $this->hasMany(SalesLead::class);
    }

    public function opportunities()
    {
        return $this->hasMany(SalesOpportunity::class);
    }

    public function activities()
    {
        return $this->hasMany(SalesActivity::class);
    }
}
