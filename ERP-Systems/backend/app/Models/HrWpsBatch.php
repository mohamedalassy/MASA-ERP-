<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrWpsBatch extends Model { protected $fillable=['payroll_run_id','batch_number','salary_month','status','file_name','file_hash','generated_at','submitted_at','response_message','meta']; protected $casts=['salary_month'=>'date','generated_at'=>'datetime','submitted_at'=>'datetime','meta'=>'array']; public function lines(){return $this->hasMany(HrWpsBatchLine::class,'wps_batch_id');} }
