<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class ProjectTeamMember extends Model {
 use HasFactory;
 protected $fillable=['project_id','employee_id','role','start_date','end_date','attendance_enabled','is_active','assigned_by','notes'];
 protected $casts=['start_date'=>'date','end_date'=>'date','attendance_enabled'=>'boolean','is_active'=>'boolean'];
 public function project(){return $this->belongsTo(Project::class);}
 public function employee(){return $this->belongsTo(HrEmployee::class,'employee_id');}
 public function assigner(){return $this->belongsTo(User::class,'assigned_by');}
}