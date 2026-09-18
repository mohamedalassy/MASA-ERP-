<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPermission extends Model
{
    protected $fillable = [
        'user_id', 'permission_key', 'granted',
        'amount_limit', 'valid_until', 'reason', 'created_by',
    ];

    protected $casts = [
        'granted' => 'boolean',
        'amount_limit' => 'decimal:2',
        'valid_until' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** التفويض المؤقت المنتهي. */
    public function isExpired(): bool
    {
        return $this->valid_until && $this->valid_until->isPast();
    }
}
