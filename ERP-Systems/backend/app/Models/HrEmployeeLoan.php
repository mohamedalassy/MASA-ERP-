<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrEmployeeLoan extends Model { protected $fillable=['employee_id','loan_number','principal_amount','balance_amount','installment_amount','start_date','status','notes']; protected $casts=['start_date'=>'date']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
