<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrReviewCycle extends Model { protected $fillable=['name','review_type','start_date','end_date','status','settings']; protected $casts=['start_date'=>'date','end_date'=>'date','settings'=>'array']; }
