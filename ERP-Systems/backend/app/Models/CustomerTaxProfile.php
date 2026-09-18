<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerTaxProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'customer_code',
        'legal_name_ar',
        'legal_name_en',
        'is_vat_registered',
        'vat_number',
        'commercial_register',
        'building_number',
        'street_name',
        'district',
        'city',
        'postal_code',
        'country_code',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_vat_registered' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
