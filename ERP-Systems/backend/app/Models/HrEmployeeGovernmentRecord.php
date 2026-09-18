<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrEmployeeGovernmentRecord extends Model { protected $fillable=['employee_id','record_type','record_number','issue_date','expiry_date','status','issuer','meta']; protected $casts=['issue_date'=>'date','expiry_date'=>'date','meta'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
