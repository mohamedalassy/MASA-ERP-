<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrPayrollRunV2 extends Model { protected $table='hr_payroll_runs_v2'; protected $fillable=['run_number','name','period_start','period_end','payment_date','status','gross_total','deductions_total','employer_contributions_total','net_total','created_by','approved_by','approved_at','meta']; protected $casts=['period_start'=>'date','period_end'=>'date','payment_date'=>'date','approved_at'=>'datetime','meta'=>'array']; public function employees(){return $this->hasMany(HrPayrollRunEmployee::class,'payroll_run_id');} }
