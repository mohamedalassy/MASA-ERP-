<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAttendanceEvent extends Model { protected $fillable=['employee_id','attendance_device_id','event_type','event_at','source','latitude','longitude','inside_geofence','external_event_id','meta']; protected $casts=['event_at'=>'datetime','inside_geofence'=>'boolean','meta'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} public function device(){return $this->belongsTo(HrAttendanceDevice::class,'attendance_device_id');} }
