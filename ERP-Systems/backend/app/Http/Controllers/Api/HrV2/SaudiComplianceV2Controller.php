<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrComplianceCheck;use App\Models\HrEmployeeGovernmentRecord;use App\Models\HrWpsBatch;use App\Models\HrGosiSnapshot;use Illuminate\Http\Request;
class SaudiComplianceV2Controller extends Controller{
 public function dashboard(){
  $today=now()->toDateString();$soon=now()->addDays(60)->toDateString();
  return response()->json([
   'checks'=>['fail'=>HrComplianceCheck::where('result','fail')->count(),'warning'=>HrComplianceCheck::where('result','warning')->count(),'critical'=>HrComplianceCheck::where('result','fail')->where('severity','critical')->count()],
   'documents'=>['expired'=>HrEmployeeGovernmentRecord::whereNotNull('expiry_date')->whereDate('expiry_date','<',$today)->count(),'expiring_60'=>HrEmployeeGovernmentRecord::whereBetween('expiry_date',[$today,$soon])->count()],
   'wps'=>['draft'=>HrWpsBatch::whereIn('status',['draft','generated'])->count(),'rejected'=>HrWpsBatch::where('status','rejected')->count()],
   'gosi'=>['mismatch'=>HrGosiSnapshot::where('status','mismatch')->count()],
   'recent_checks'=>HrComplianceCheck::with('employee:id,first_name,last_name')->latest('checked_at')->limit(20)->get(),
   'expiring_records'=>HrEmployeeGovernmentRecord::with('employee:id,first_name,last_name')->whereBetween('expiry_date',[$today,$soon])->orderBy('expiry_date')->limit(20)->get()
  ]);
 }
 public function records(Request $r){$q=HrEmployeeGovernmentRecord::with('employee');if($r->record_type)$q->where('record_type',$r->record_type);return response()->json($q->orderBy('expiry_date')->paginate($r->integer('per_page',50)));}
}