<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AiSalesTask extends Model { protected $fillable=['company_id','lead_id','opportunity_id','type','title','description','status','priority','due_at','assigned_to']; protected $casts=['due_at'=>'datetime']; public function company(){return $this->belongsTo(AiSalesCompany::class,'company_id');}}