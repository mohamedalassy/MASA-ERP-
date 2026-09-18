<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class AiSalesSignal extends Model {
 use HasFactory;
 protected $fillable=['company_id','type','title','description','strength','confidence','source','source_url','evidence','detected_at','expires_at'];
 protected $casts=['evidence'=>'array','detected_at'=>'datetime','expires_at'=>'datetime'];
 public function company(){return $this->belongsTo(AiSalesCompany::class,'company_id');}
}