<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSuccessionCandidate extends Model { protected $fillable=['succession_plan_id','employee_id','readiness','readiness_score','development_actions']; protected $casts=['development_actions'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
