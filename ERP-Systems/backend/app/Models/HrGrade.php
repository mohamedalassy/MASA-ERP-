<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGrade extends Model { protected $fillable=['code','name','name_en','level','min_salary','max_salary','benefits','is_active']; protected $casts=['benefits'=>'array','is_active'=>'boolean']; public function positions(){return $this->hasMany(HrPosition::class,'grade_id');} }
