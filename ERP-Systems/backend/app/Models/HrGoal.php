<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGoal extends Model { protected $fillable=['cycle_id','employee_id','department_id','parent_id','title','description','weight','target_value','current_value','unit','progress','status']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
