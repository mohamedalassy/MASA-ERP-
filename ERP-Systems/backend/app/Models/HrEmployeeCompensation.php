<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrEmployeeCompensation extends Model { protected $fillable=['employee_id','salary_structure_id','basic_salary','currency','effective_from','effective_to','component_overrides','is_active']; protected $casts=['effective_from'=>'date','effective_to'=>'date','component_overrides'=>'array','is_active'=>'boolean']; public function employee(){return $this->belongsTo(HrEmployee::class);} public function salaryStructure(){return $this->belongsTo(HrSalaryStructure::class,'salary_structure_id');} }
