<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrRoster extends Model { protected $fillable=['employee_id','shift_id','work_date','planned_start','planned_end','status','notes']; protected $casts=['work_date'=>'date']; public function employee(){return $this->belongsTo(HrEmployee::class);} public function shift(){return $this->belongsTo(HrShift::class,'shift_id');} }
