<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesBuyingCommittee extends Model{protected $table='ai_sales_buying_committee';protected $fillable=['company_id','contact_id','role','influence_score','sentiment','interests','notes'];protected $casts=['interests'=>'array'];public function contact(){return $this->belongsTo(AiSalesContact::class,'contact_id');}}