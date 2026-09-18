<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrComplianceCheck extends Model { protected $fillable=['employee_id','check_code','category','result','severity','title','details','due_date','evidence','checked_at']; protected $casts=['due_date'=>'date','evidence'=>'array','checked_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
