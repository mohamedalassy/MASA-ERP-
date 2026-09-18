<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrComplianceException extends Model { protected $fillable=['rule_id','employee_id','title','description','severity','status','due_date','resolved_at','meta']; protected $casts=['meta'=>'array','due_date'=>'date','resolved_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class,'employee_id');} }
