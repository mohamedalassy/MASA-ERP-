<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class HrEmployeeLifecycleEvent extends Model{protected $fillable=['employee_id','event_type','effective_date','title','notes','before_data','after_data'];protected $casts=['effective_date'=>'date','before_data'=>'array','after_data'=>'array'];public function employee(){return $this->belongsTo(HrEmployee::class);}}