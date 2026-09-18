<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrWpsBatchLine extends Model { protected $fillable=['wps_batch_id','employee_id','iban','basic_salary','housing_allowance','other_earnings','deductions','net_salary','status','validation_errors']; protected $casts=['validation_errors'=>'array']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
