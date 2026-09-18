<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAttendanceCorrectionRequest extends Model { protected $fillable=['employee_id','work_date','requested_check_in','requested_check_out','reason','status','reviewed_by','review_notes','reviewed_at']; protected $casts=['work_date'=>'date','requested_check_in'=>'datetime','requested_check_out'=>'datetime','reviewed_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
