<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AiSalesTender extends Model { protected $fillable=['title','issuer','reference','industry','region','estimated_value','currency','deadline','fit_score','status','source','source_url','matched_items','requirements']; protected $casts=['estimated_value'=>'decimal:2','deadline'=>'date','matched_items'=>'array','requirements'=>'array'];}