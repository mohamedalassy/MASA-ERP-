<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrLearningEnrollment extends Model {
 protected $fillable=['employee_id','course_id','status','due_date','completed_at','score','certificate_path'];
 protected $casts=['due_date'=>'date','completed_at'=>'datetime'];
 public function employee(){return $this->belongsTo(HrEmployee::class);}
 public function course(){return $this->belongsTo(HrLearningCourse::class,'course_id');}
}