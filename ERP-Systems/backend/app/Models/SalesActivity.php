<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesActivity extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'customer_id',
        'lead_id',
        'opportunity_id',
        'project_id',
        'type',
        'subject',
        'description',
        'status',
        'priority',
        'activity_at',
        'due_at',
        'completed_at',
        'owner_id',
        'created_by',
        'outcome',
        'next_action',
        'next_action_at',
    ];

    protected $casts = [
        'activity_at' => 'datetime',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
        'next_action_at' => 'datetime',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function lead()
    {
        return $this->belongsTo(SalesLead::class, 'lead_id');
    }

    public function opportunity()
    {
        return $this->belongsTo(SalesOpportunity::class, 'opportunity_id');
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
}
