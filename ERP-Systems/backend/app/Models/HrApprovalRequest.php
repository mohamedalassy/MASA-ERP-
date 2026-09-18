<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrApprovalRequest extends Model { protected $fillable=['request_number','request_type','subject_id','employee_id','title','payload','status','current_step','requested_by','completed_at']; protected $casts=['payload'=>'array','completed_at'=>'datetime']; public function steps(){return $this->hasMany(HrApprovalStep::class,'approval_request_id')->orderBy('step_number');} public function employee(){return $this->belongsTo(HrEmployee::class);} }
