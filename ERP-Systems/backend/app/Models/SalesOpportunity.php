<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOpportunity extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'contact_id',
        'lead_id',
        'project_id',
        'opportunity_number',
        'name',
        'description',
        'stage',
        'status',
        'priority',
        'source',
        'industry',
        'expected_value',
        'probability',
        'expected_close_date',
        'next_action_at',
        'owner_id',
        'created_by',
        'lost_reason',
        'won_at',
        'lost_at',
        'last_activity_at',
        'notes',
    ];

    protected $casts = [
        'expected_value' => 'decimal:2',
        'probability' => 'integer',
        'expected_close_date' => 'date',
        'next_action_at' => 'datetime',
        'won_at' => 'datetime',
        'lost_at' => 'datetime',
        'last_activity_at' => 'datetime',
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

    public function lead()
    {
        return $this->belongsTo(SalesLead::class, 'lead_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function activities()
    {
        return $this->hasMany(SalesActivity::class, 'opportunity_id')
            ->latest('activity_at');
    }
}
