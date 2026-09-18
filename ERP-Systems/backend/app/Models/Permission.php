<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** كتالوج الصلاحيات — مرجع للواجهة وشاشة الإعدادات. */
class Permission extends Model
{
    protected $fillable = [
        'key', 'module', 'name', 'description',
        'supports_amount_limit', 'is_sensitive', 'sort_order',
    ];

    protected $casts = [
        'supports_amount_limit' => 'boolean',
        'is_sensitive' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function scopeSensitive($query)
    {
        return $query->where('is_sensitive', true);
    }
}
