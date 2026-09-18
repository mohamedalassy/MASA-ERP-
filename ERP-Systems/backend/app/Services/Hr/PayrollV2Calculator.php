<?php
namespace App\Services\Hr;
use App\Models\HrAttendanceDailySummary;
use App\Models\HrEmployee;
use App\Models\HrEmployeeCompensation;
use App\Models\HrEmployeeLoan;

class PayrollV2Calculator {
 public function calculate(HrEmployee $employee,string $from,string $to): array {
  $comp=HrEmployeeCompensation::where('employee_id',$employee->id)->where('is_active',true)
    ->whereDate('effective_from','<=',$to)->where(fn($q)=>$q->whereNull('effective_to')->orWhereDate('effective_to','>=',$from))
    ->latest('effective_from')->first();
  $basic=(float)($comp?->basic_salary ?? 0);
  $att=HrAttendanceDailySummary::where('employee_id',$employee->id)->whereBetween('work_date',[$from,$to]);
  $worked=(clone $att)->sum('worked_minutes'); $otMinutes=(clone $att)->sum('overtime_minutes');
  $late=(clone $att)->sum('late_minutes'); $absence=(clone $att)->where('status','absent')->count();
  $hourly=$basic>0 ? $basic/30/8 : 0;
  $overtime=round(($otMinutes/60)*$hourly*1.5,2);
  $absenceDeduction=round(($basic/30)*$absence,2);
  $loan=HrEmployeeLoan::where('employee_id',$employee->id)->where('status','active')->sum('installment_amount');
  $deductions=round($absenceDeduction+(float)$loan,2);
  $gross=round($basic+$overtime,2); $net=max(0,round($gross-$deductions,2));
  return compact('basic','worked','otMinutes','late','absence','overtime','absenceDeduction','loan','deductions','gross','net');
 }
}