<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesWinLossReview extends Model{protected $fillable=['opportunity_id', 'outcome', 'reasons', 'competitors', 'lessons'];protected $casts=['reasons'=>'array','competitors'=>'array'];}