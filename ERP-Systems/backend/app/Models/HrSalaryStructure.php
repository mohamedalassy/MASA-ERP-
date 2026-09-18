<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSalaryStructure extends Model { protected $fillable=['code','name','pay_frequency','is_active','settings']; protected $casts=['is_active'=>'boolean','settings'=>'array']; public function components(){return $this->belongsToMany(HrSalaryComponent::class,'hr_salary_structure_components','salary_structure_id','salary_component_id')->withPivot(['value','sort_order']);} }
