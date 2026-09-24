<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class HrEmployeeSkill extends Model{protected $fillable=['employee_id','skill_id','level','target_level','validated_at','validated_by'];protected $casts=['validated_at'=>'date'];public function employee(){return $this->belongsTo(HrEmployee::class);}public function skill(){return $this->belongsTo(HrSkill::class,'skill_id');}}