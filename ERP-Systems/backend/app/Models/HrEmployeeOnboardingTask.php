<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrEmployeeOnboardingTask extends Model { protected $fillable=['onboarding_id','title','owner_type','owner_user_id','due_date','status','completed_at','notes']; protected $casts=['due_date'=>'date','completed_at'=>'datetime']; }
