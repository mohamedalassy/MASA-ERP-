<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentPermission extends Model
{
    protected $fillable = [
        'department_id', 'permission_key', 'granted',
        'amount_limit', 'created_by',
    ];

    protected $casts = [
        'granted' => 'boolean',
        'amount_limit' => 'decimal:2',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
}
