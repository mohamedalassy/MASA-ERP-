<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;use Illuminate\Database\Eloquent\Model;
class AiSalesLead extends Model {use HasFactory;protected $fillable=['company_id','status','priority','qualification_score','qualification_reasons','last_qualified_at','contact_name','contact_title','email','phone','notes','owner_id','approved_by','approved_at','routing_reason'];protected $casts=['qualification_reasons'=>'array','last_qualified_at'=>'datetime','approved_at'=>'datetime'];public function company(){return $this->belongsTo(AiSalesCompany::class,'company_id');}public function opportunities(){return $this->hasMany(AiSalesOpportunity::class,'lead_id');}public function owner(){return $this->belongsTo(User::class,'owner_id');}}
