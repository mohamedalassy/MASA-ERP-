<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSurveyResponse extends Model { protected $fillable=['survey_id','employee_id','answers','enps_score','submitted_at']; protected $casts=['answers'=>'array','submitted_at'=>'datetime']; }
