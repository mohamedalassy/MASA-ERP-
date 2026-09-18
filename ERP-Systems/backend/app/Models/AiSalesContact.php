<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesContact extends Model {protected $fillable=['company_id','name','job_title','email','phone','is_decision_maker','confidence','source','quality_score','quality_issues'];protected $casts=['is_decision_maker'=>'boolean','quality_issues'=>'array'];public function company(){return $this->belongsTo(AiSalesCompany::class,'company_id');}}
