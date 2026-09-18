<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGoalCycle extends Model { protected $fillable=['name','start_date','end_date','status']; protected $casts=['start_date'=>'date','end_date'=>'date']; public function goals(){return $this->hasMany(HrGoal::class,'cycle_id');} }
