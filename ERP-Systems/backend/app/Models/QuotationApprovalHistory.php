<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class QuotationApprovalHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'project_id',
        'action',
        'from_status',
        'to_status',
        'reason',
        'acted_by',
        'acted_at',
        'snapshot',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
        'snapshot' => 'array',
    ];

    public function quotation()
    {
        return $this->belongsTo(ProjectQuotation::class, 'quotation_id');
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'acted_by');
    }
}
