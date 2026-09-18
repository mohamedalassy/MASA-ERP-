<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAttendancePolicy extends Model { protected $fillable=['code','name','late_grace_minutes','early_leave_grace_minutes','minimum_work_minutes','overtime_after_minutes','allow_remote','require_geofence','working_days','settings','is_active']; protected $casts=['allow_remote'=>'boolean','require_geofence'=>'boolean','working_days'=>'array','settings'=>'array','is_active'=>'boolean']; }
