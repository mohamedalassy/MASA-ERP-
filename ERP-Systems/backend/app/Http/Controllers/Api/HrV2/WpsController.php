<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrPayrollRun;use App\Services\WpsFileService;use Illuminate\Http\Request;
class WpsController extends Controller{
 public function __construct(private readonly WpsFileService $wps){}
 public function index(Request $request){$runs=HrPayrollRun::query()->where(function($q){$q->whereNotNull('wps_generated_at')->orWhereIn('status',['approved','posted','paid']);})->orderByDesc('period_year')->orderByDesc('period_month')->get()->map(fn($r)=>['id'=>$r->id,'batch_number'=>$r->run_number,'salary_month'=>sprintf('%04d-%02d',$r->period_year,$r->period_month),'lines_count'=>$r->employees_count,'total_net'=>$r->total_net,'status'=>$r->wps_validation_status?:($r->wps_generated_at?'generated':'pending'),'payroll_status'=>$r->status,'wps_generated_at'=>$r->wps_generated_at]);return response()->json(['success'=>true,'data'=>$runs]);}
 public function generate(Request $request){$data=$request->validate(['payroll_run_id'=>['required','integer','exists:hr_payroll_runs,id']]);$run=HrPayrollRun::findOrFail($data['payroll_run_id']);abort_unless(in_array($run->status,['approved','posted','paid'],true),422,'يجب اعتماد تشغيل الرواتب قبل توليد WPS.');$result=$this->wps->generate($run);return response()->json(['success'=>$result['generated'],'data'=>$result],$result['generated']?201:422);}
}