<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSuccessionPlan extends Model { protected $fillable=['position_id','criticality','notes']; public function candidates(){return $this->hasMany(HrSuccessionCandidate::class,'succession_plan_id');} }
