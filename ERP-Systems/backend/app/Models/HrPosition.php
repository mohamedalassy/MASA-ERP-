<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrPosition extends Model { protected $fillable=['code','name','name_en','department_id','job_title_id','grade_id','reports_to_position_id','headcount_budget','is_managerial','is_active','description']; protected $casts=['is_managerial'=>'boolean','is_active'=>'boolean']; public function department(){return $this->belongsTo(HrDepartment::class,'department_id');} public function grade(){return $this->belongsTo(HrGrade::class,'grade_id');} public function employees(){return $this->hasMany(HrEmployee::class,'position_id');} }
