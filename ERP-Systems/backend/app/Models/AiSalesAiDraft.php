<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesAiDraft extends Model {protected $fillable=['company_id','lead_id','channel','purpose','tone','subject','body','context','status','approved_at','approved_by'];protected $casts=['context'=>'array','approved_at'=>'datetime'];public function company(){return $this->belongsTo(AiSalesCompany::class,'company_id');}}