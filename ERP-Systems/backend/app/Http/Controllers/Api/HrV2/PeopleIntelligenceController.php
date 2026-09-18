<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrEmployee;use App\Models\HrAttendanceDailySummary;use App\Models\HrPayrollRunV2;
use App\Models\HrRequisition;use App\Models\HrPerformanceReview;use App\Models\HrWorkforcePlan;
class PeopleIntelligenceController extends Controller{
 public function dashboard(){
  return response()->json([
   'workforce'=>['active'=>HrEmployee::where('status','active')->count(),'on_leave'=>HrEmployee::where('status','on_leave')->count(),'terminated'=>HrEmployee::where('status','terminated')->count()],
   'attendance'=>['late_30d'=>HrAttendanceDailySummary::whereDate('work_date','>=',now()->subDays(30))->where('late_minutes','>',0)->count(),'absence_30d'=>HrAttendanceDailySummary::whereDate('work_date','>=',now()->subDays(30))->where('status','absent')->count()],
   'payroll'=>HrPayrollRunV2::latest('period_end')->first(['id','name','period_end','gross_total','net_total','status']),
   'recruitment'=>['open'=>HrRequisition::where('status','open')->count(),'headcount'=>HrRequisition::where('status','open')->sum('headcount')],
   'performance'=>['pending_reviews'=>HrPerformanceReview::whereIn('status',['pending','in_progress'])->count()],
   'workforce_plans'=>HrWorkforcePlan::latest('year')->limit(20)->get()
  ]);
 }
}