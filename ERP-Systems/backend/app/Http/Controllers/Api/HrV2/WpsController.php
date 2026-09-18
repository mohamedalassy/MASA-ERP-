<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrWpsBatch;use App\Models\HrWpsBatchLine;use App\Models\HrPayrollRunV2;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;
class WpsController extends Controller{
 public function index(Request $r){return response()->json(HrWpsBatch::withCount('lines')->latest()->paginate($r->integer('per_page',25)));}
 public function generate(Request $r){
  $d=$r->validate(['payroll_run_id'=>'required|exists:hr_payroll_runs_v2,id']);$run=HrPayrollRunV2::with('employees.employee')->findOrFail($d['payroll_run_id']);
  $batch=DB::transaction(function()use($run){$b=HrWpsBatch::create(['payroll_run_id'=>$run->id,'batch_number'=>'WPS-'.now()->format('YmdHis'),'salary_month'=>$run->period_end,'status'=>'draft']);
   foreach($run->employees as $p){$iban=$p->employee?->iban;$errors=[];if(!$iban)$errors[]='missing_iban';HrWpsBatchLine::create(['wps_batch_id'=>$b->id,'employee_id'=>$p->employee_id,'iban'=>$iban,'basic_salary'=>$p->basic_salary,'other_earnings'=>max(0,$p->gross_salary-$p->basic_salary),'deductions'=>$p->deductions,'net_salary'=>$p->net_salary,'status'=>$errors?'invalid':'ready','validation_errors'=>$errors]);}return $b;});
  return response()->json($batch->load('lines'),201);
 }
}