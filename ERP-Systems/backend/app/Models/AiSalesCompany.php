<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiSalesCompany extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'legal_name',
        'industry',
        'website',
        'country',
        'region',
        'city',
        'company_size',
        'source',
        'source_url',
        'status',
        'data_confidence',
        'enrichment',
        'discovered_at',
        'last_enriched_at',
        'created_by',
        'quality_score',
        'quality_issues',
        'dedupe_key',

        // Geolocation
        'latitude',
        'longitude',
        'geocoding_source',
        'geocoded_at',
    ];

    protected $casts = [
        'enrichment' => 'array',
        'quality_issues' => 'array',
        'discovered_at' => 'datetime',
        'last_enriched_at' => 'datetime',

        // Geolocation
        'latitude' => 'float',
        'longitude' => 'float',
        'geocoded_at' => 'datetime',
    ];

    public function signals()
    {
        return $this->hasMany(AiSalesSignal::class, 'company_id');
    }

    public function scores()
    {
        return $this->hasMany(AiSalesScore::class, 'company_id');
    }

    public function latestScore()
    {
        return $this->hasOne(AiSalesScore::class, 'company_id')->latestOfMany();
    }

    public function leads()
    {
        return $this->hasMany(AiSalesLead::class, 'company_id');
    }

    public function opportunities()
    {
        return $this->hasMany(AiSalesOpportunity::class, 'company_id');
    }

    public function contacts()
    {
        return $this->hasMany(AiSalesContact::class, 'company_id');
    }

    public function marketMatches()
    {
        return $this->hasMany(AiSalesMarketMatch::class, 'company_id');
    }

    public function revenueOpportunities()
    {
        return $this->hasMany(AiSalesRevenueOpportunity::class, 'company_id');
    }
}
