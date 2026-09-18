<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrInterview extends Model { protected $fillable=['application_id','interview_type','scheduled_at','duration_minutes','location','status','score','scorecard','feedback']; protected $casts=['scheduled_at'=>'datetime','scorecard'=>'array']; }
