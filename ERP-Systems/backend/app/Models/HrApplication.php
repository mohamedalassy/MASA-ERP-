<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrApplication extends Model { protected $fillable=['requisition_id','candidate_id','stage','status','match_score','match_explanation','notes']; protected $casts=['match_explanation'=>'array']; public function candidate(){return $this->belongsTo(HrCandidate::class);} public function requisition(){return $this->belongsTo(HrRequisition::class);} public function interviews(){return $this->hasMany(HrInterview::class,'application_id');} }
