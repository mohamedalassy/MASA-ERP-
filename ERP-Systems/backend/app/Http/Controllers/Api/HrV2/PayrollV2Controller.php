<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;
use App\Models\HrEmployee; use App\Models\HrPayrollRunV2; use App\Models\HrPayrollRunEmployee;
use App\Services\Hr\PayrollV2Calculator; use Illuminate\Http\Request; use Illuminate\Support\Facades\DB;

class PayrollV2Controller extends Controller {
 public function index(Request $r){return response()->json(HrPayrollRunV2::withCount('employees')->latest()->paginate($r->integer('per_page',25)));}
 public function show(HrPayrollRunV2 $payrollRun){return response()->json($payrollRun->load(['employees.employee','employees.lines']));}
 public function store(Request $r){
  $d=$r->validate(['name'=>'required|string|max:255','period_start'=>'required|date','period_end'=>'required|date|after_or_equal:period_start','payment_date'=>'nullable|date']);
  $d['run_number']='PR-'.now()->format('YmdHis'); $d['created_by']=$r->user()?->id;
  return response()->json(HrPayrollRunV2::create($d),201);
 }
 public function calculate(HrPayrollRunV2 $payrollRun,PayrollV2Calculator $calculator){
  abort_if(in_array($payrollRun->status,['approved','posted','paid','closed']),422,'Payroll run is locked.');
  DB::transaction(function()use($payrollRun,$calculator){
   $payrollRun->update(['status'=>'calculating']); $payrollRun->employees()->delete();
   $tot=['gross'=>0,'deductions'=>0,'net'=>0];
   HrEmployee::where('status','active')->chunkById(100,function($employees)use($payrollRun,$calculator,&$tot){
    foreach($employees as $employee){$x=$calculator->calculate($employee,$payrollRun->period_start->toDateString(),$payrollRun->period_end->toDateString());
     HrPayrollRunEmployee::create(['payroll_run_id'=>$payrollRun->id,'employee_id'=>$employee->id,'basic_salary'=>$x['basic'],'earnings'=>$x['basic'],'overtime'=>$x['overtime'],'deductions'=>$x['deductions'],'gross_salary'=>$x['gross'],'net_salary'=>$x['net'],'worked_minutes'=>$x['worked'],'overtime_minutes'=>$x['otMinutes'],'late_minutes'=>$x['late'],'absence_days'=>$x['absence'],'calculation_snapshot'=>$x]);
     $tot['gross']+=$x['gross'];$tot['deductions']+=$x['deductions'];$tot['net']+=$x['net'];
    }});
   $payrollRun->update(['status'=>'review','gross_total'=>$tot['gross'],'deductions_total'=>$tot['deductions'],'net_total'=>$tot['net']]);
  });
  return response()->json($payrollRun->fresh()->load('employees.employee'));
 }
 public function approve(Request $r,HrPayrollRunV2 $payrollRun){
  abort_unless($payrollRun->status==='review',422,'Payroll must be in review.');
  $payrollRun->update(['status'=>'approved','approved_by'=>$r->user()?->id,'approved_at'=>now()]);
  return response()->json($payrollRun);
 }
}