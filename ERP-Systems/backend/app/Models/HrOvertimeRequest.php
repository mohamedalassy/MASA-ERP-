<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrOvertimeRequest extends Model { protected $fillable=['employee_id','work_date','requested_minutes','approved_minutes','reason','status','approved_by','approved_at']; protected $casts=['work_date'=>'date','approved_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
