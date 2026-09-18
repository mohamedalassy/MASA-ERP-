<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSurvey extends Model { protected $fillable=['title','survey_type','description','start_date','end_date','status','anonymous','questions']; protected $casts=['start_date'=>'date','end_date'=>'date','anonymous'=>'boolean','questions'=>'array']; }
