<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ProjectAttendanceLog extends Model {
 protected $fillable=['project_id','project_team_member_id','employee_id','event_type','recorded_at','latitude','longitude','accuracy_meters','distance_meters','geofence_radius','inside_geofence','source','ip_address','user_agent','metadata'];
 protected $casts=['recorded_at'=>'datetime','latitude'=>'decimal:7','longitude'=>'decimal:7','accuracy_meters'=>'decimal:2','distance_meters'=>'decimal:2','geofence_radius'=>'integer','inside_geofence'=>'boolean','metadata'=>'array'];
 public function project(){return $this->belongsTo(Project::class);}
 public function employee(){return $this->belongsTo(HrEmployee::class,'employee_id');}
 public function teamMember(){return $this->belongsTo(ProjectTeamMember::class,'project_team_member_id');}
}