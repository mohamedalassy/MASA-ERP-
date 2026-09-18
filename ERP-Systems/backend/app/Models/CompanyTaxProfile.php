<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyTaxProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'legal_name_ar',
        'legal_name_en',
        'vat_number',
        'commercial_register',
        'building_number',
        'street_name',
        'district',
        'city',
        'postal_code',
        'country_code',
        'branch_name',
        'branch_code',
        'is_default',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function invoices(): HasMany
    {
        return $this->hasMany(TaxInvoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
