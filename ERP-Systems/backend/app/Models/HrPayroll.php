<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class HrPayroll extends Model {
 protected $table='hr_payrolls';
 protected $fillable=['employee_id','payroll_run_id','year','month','period_year','period_month','period_start','period_end','basic_salary','allowances','housing_allowance','transport_allowance','other_allowances','overtime_hours','overtime_amount','bonuses','absence_deductions','late_deductions','loans_deductions','absence_deduction','late_deduction','loan_deduction','other_deductions','gosi_deduction','gross_salary','total_deductions','net_salary','worked_minutes','overtime_minutes','worked_days','absent_days','late_minutes','gosi_employer','gosi_base','gosi_scheme','eosb_accrual','cost_center_id','project_allocations','status','approved_at','approved_by','paid_at','notes'];
 protected $casts=['period_start'=>'date','period_end'=>'date','approved_at'=>'datetime','paid_at'=>'datetime','project_allocations'=>'array','basic_salary'=>'decimal:2','housing_allowance'=>'decimal:2','transport_allowance'=>'decimal:2','other_allowances'=>'decimal:2','gross_salary'=>'decimal:2','total_deductions'=>'decimal:2','net_salary'=>'decimal:2','gosi_deduction'=>'decimal:2','gosi_employer'=>'decimal:2','gosi_base'=>'decimal:2','eosb_accrual'=>'decimal:2'];
 public function employee():BelongsTo{return $this->belongsTo(HrEmployee::class,'employee_id');}
 public function payrollRun():BelongsTo{return $this->belongsTo(HrPayrollRun::class,'payroll_run_id');}
 public function costCenter():BelongsTo{return $this->belongsTo(CostCenter::class,'cost_center_id');}
}
