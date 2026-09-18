<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrPayrollRunLine extends Model { protected $fillable=['payroll_run_employee_id','salary_component_id','code','name','type','quantity','rate','amount','source','meta']; protected $casts=['meta'=>'array']; }
