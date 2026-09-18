<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesRevenueOpportunity extends Model{protected $fillable=['company_id', 'type', 'title', 'estimated_value', 'score', 'recommended_items', 'reasons', 'status'];protected $casts=['recommended_items'=>'array','reasons'=>'array'];}