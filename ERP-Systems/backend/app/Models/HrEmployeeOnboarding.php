<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrEmployeeOnboarding extends Model { protected $fillable=['employee_id','template_id','start_date','status','progress']; protected $casts=['start_date'=>'date']; public function employee(){return $this->belongsTo(HrEmployee::class);} public function tasks(){return $this->hasMany(HrEmployeeOnboardingTask::class,'onboarding_id');} }
