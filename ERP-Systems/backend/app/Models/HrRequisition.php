<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrRequisition extends Model { protected $fillable=['requisition_number','title','department_id','position_id','hiring_manager_id','headcount','budget_min','budget_max','employment_type','status','description','requirements','target_date','created_by']; protected $casts=['requirements'=>'array','target_date'=>'date']; public function applications(){return $this->hasMany(HrApplication::class,'requisition_id');} }
