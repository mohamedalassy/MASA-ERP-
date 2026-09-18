<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrServiceRequest extends Model { protected $fillable=['request_number','employee_id','category','subject','description','priority','status','assigned_to','resolved_at']; protected $casts=['resolved_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
