<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class AiSalesScore extends Model {
 use HasFactory;
 protected $fillable=['company_id','fit_score','intent_score','timing_score','confidence_score','overall_score','service_matches','reasons','model_version','scored_at'];
 protected $casts=['service_matches'=>'array','reasons'=>'array','scored_at'=>'datetime'];
 public function company(){return $this->belongsTo(AiSalesCompany::class,'company_id');}
}