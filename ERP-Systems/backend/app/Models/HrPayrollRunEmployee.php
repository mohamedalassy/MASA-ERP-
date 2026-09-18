<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrPayrollRunEmployee extends Model { protected $fillable=['payroll_run_id','employee_id','basic_salary','earnings','overtime','deductions','employer_contributions','gross_salary','net_salary','worked_minutes','overtime_minutes','late_minutes','absence_days','status','calculation_snapshot']; protected $casts=['calculation_snapshot'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} public function lines(){return $this->hasMany(HrPayrollRunLine::class,'payroll_run_employee_id');} }
