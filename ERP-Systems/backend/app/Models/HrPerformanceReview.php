<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrPerformanceReview extends Model { protected $fillable=['cycle_id','employee_id','reviewer_employee_id','reviewer_type','score','status','answers','summary']; protected $casts=['answers'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
