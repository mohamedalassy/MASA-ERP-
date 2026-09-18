<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGeofence extends Model { protected $fillable=['branch_id','name','latitude','longitude','radius_meters','is_active']; protected $casts=['is_active'=>'boolean']; public function branch(){return $this->belongsTo(HrBranch::class,'branch_id');} }
