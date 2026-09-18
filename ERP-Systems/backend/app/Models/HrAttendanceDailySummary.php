<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAttendanceDailySummary extends Model { protected $fillable=['employee_id','work_date','first_in','last_out','worked_minutes','late_minutes','early_leave_minutes','overtime_minutes','break_minutes','status','exceptions']; protected $casts=['work_date'=>'date','first_in'=>'datetime','last_out'=>'datetime','exceptions'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
