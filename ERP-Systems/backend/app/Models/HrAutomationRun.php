<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAutomationRun extends Model { protected $fillable=['rule_id','trigger_reference','status','input','output','error_message','started_at','finished_at']; protected $casts=['input'=>'array','output'=>'array','started_at'=>'datetime','finished_at'=>'datetime']; }
