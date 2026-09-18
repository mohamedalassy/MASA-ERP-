<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesLead extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'contact_id',
        'lead_number',
        'name',
        'company_name',
        'job_title',
        'phone',
        'email',
        'source',
        'status',
        'priority',
        'industry',
        'estimated_value',
        'owner_id',
        'created_by',
        'notes',
        'qualified_at',
        'converted_at',
        'converted_opportunity_id',
        'disqualification_reason',
    ];

    protected $casts = [
        'estimated_value' => 'decimal:2',
        'qualified_at' => 'datetime',
        'converted_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function contact()
    {
        return $this->belongsTo(CustomerContact::class, 'contact_id');
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function convertedOpportunity()
    {
        return $this->belongsTo(
            SalesOpportunity::class,
            'converted_opportunity_id'
        );
    }

    public function activities()
    {
        return $this->hasMany(SalesActivity::class, 'lead_id');
    }
}
