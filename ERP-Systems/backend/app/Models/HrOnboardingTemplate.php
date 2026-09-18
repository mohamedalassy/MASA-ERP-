<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrOnboardingTemplate extends Model { protected $fillable=['code','name','department_id','is_active','settings']; protected $casts=['is_active'=>'boolean','settings'=>'array']; public function tasks(){return $this->hasMany(HrOnboardingTemplateTask::class,'template_id');} }
