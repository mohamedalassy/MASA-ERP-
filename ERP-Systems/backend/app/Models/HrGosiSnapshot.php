<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGosiSnapshot extends Model { protected $fillable=['employee_id','effective_month','basic_salary','housing_allowance','contributory_wage','employee_contribution','employer_contribution','calculation_version','calculation_details','status']; protected $casts=['effective_month'=>'date','calculation_details'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
