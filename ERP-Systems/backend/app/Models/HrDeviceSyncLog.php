<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrDeviceSyncLog extends Model { protected $fillable=['attendance_device_id','direction','status','records_received','records_created','records_failed','message','started_at','finished_at','meta']; protected $casts=['started_at'=>'datetime','finished_at'=>'datetime','meta'=>'array']; public function device(){return $this->belongsTo(HrAttendanceDevice::class,'attendance_device_id');} }
