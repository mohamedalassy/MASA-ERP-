<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrLeaveRequest extends Model { protected $fillable=['employee_id','leave_type','start_date','end_date','days','reason','status','approved_by','approved_at']; protected $casts=['start_date'=>'date','end_date'=>'date','approved_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
