<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrWorkforcePlan extends Model { protected $fillable=['name','year','department_id','current_headcount','planned_headcount','current_cost','budgeted_cost','status','assumptions']; protected $casts=['assumptions'=>'array']; }
