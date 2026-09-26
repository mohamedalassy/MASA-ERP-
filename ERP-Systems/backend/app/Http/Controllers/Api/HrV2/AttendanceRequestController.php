<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrAttendanceCorrectionRequest;use App\Models\HrAttendanceDaily;use App\Models\HrAttendanceDailySummary;use App\Models\HrAttendanceEvent;use App\Models\HrEmployee;use App\Models\HrLeaveEntitlement;use App\Models\HrLeaveRequest;use App\Models\HrOvertimeRequest;use App\Services\Hr\AttendanceProcessor;use Carbon\Carbon;use Carbon\CarbonPeriod;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;
class AttendanceRequestController extends Controller{
 public function storeCorrection(Request $r){
  $d=$r->validate(['employee_id'=>'required|integer|exists:hr_employees,id','work_date'=>'required|date_format:Y-m-d','requested_check_in'=>'nullable|date_format:Y-m-d H:i:s','requested_check_out'=>'nullable|date_format:Y-m-d H:i:s','reason'=>'required|string|max:1000']);
  if(empty($d['requested_check_in']) && empty($d['requested_check_out'])) return response()->json(['message'=>'أدخل وقت الدخول أو الخروج على الأقل.'],422);
  foreach(['requested_check_in','requested_check_out'] as $field){if(!empty($d[$field]) && substr($d[$field],0,10)!==$d['work_date']) return response()->json(['message'=>'تاريخ وقت الدخول والخروج يجب أن يطابق يوم الحضور.'],422);}
  if(!empty($d['requested_check_in']) && !empty($d['requested_check_out']) && $d['requested_check_out']<=$d['requested_check_in']) return response()->json(['message'=>'وقت الخروج يجب أن يكون بعد وقت الدخول.'],422);
  $request=HrAttendanceCorrectionRequest::create($d+['status'=>'pending']);
  return response()->json(['success'=>true,'data'=>$request->load('employee')],201);
 }
 public function corrections(Request $r){return response()->json(HrAttendanceCorrectionRequest::with('employee')->latest()->paginate($r->integer('per_page',50)));}
 public function storeOvertime(Request $r){
  $d=$r->validate(['employee_id'=>'required|integer|exists:hr_employees,id','work_date'=>'required|date_format:Y-m-d','requested_minutes'=>'required|integer|min:1|max:1440','reason'=>'required|string|max:1000']);
  if(HrOvertimeRequest::where('employee_id',$d['employee_id'])->whereDate('work_date',$d['work_date'])->where('status','pending')->exists()) return response()->json(['message'=>'يوجد طلب عمل إضافي معلق لهذا الموظف في نفس اليوم.'],422);
  $request=HrOvertimeRequest::create($d+['status'=>'pending']);
  return response()->json(['success'=>true,'data'=>$request->load('employee')],201);
 }
 public function overtime(Request $r){return response()->json(HrOvertimeRequest::with('employee')->latest()->paginate($r->integer('per_page',50)));}
 public function storeLeave(Request $r){
  $d=$r->validate(['employee_id'=>'required|integer|exists:hr_employees,id','leave_type'=>'required|string|max:50','start_date'=>'required|date_format:Y-m-d','end_date'=>'required|date_format:Y-m-d|after_or_equal:start_date','reason'=>'required|string|max:1000']);
  $days=Carbon::createFromFormat('!Y-m-d',$d['start_date'])->diffInDays(Carbon::createFromFormat('!Y-m-d',$d['end_date']))+1;
  if($days>365) return response()->json(['message'=>'المدة القصوى للطلب سنة واحدة.'],422);
  if(HrLeaveRequest::where('employee_id',$d['employee_id'])->whereIn('status',['draft','pending','approved'])->whereDate('start_date','<=',$d['end_date'])->whereDate('end_date','>=',$d['start_date'])->exists()) return response()->json(['message'=>'يوجد طلب إجازة متداخل لنفس الموظف.'],422);
  $request=HrLeaveRequest::create($d+['days'=>$days,'status'=>'pending']);
  return response()->json(['success'=>true,'data'=>$request->load('employee')],201);
 }
 public function leaves(Request $r){return response()->json(HrLeaveRequest::with('employee')->latest()->paginate($r->integer('per_page',50)));}
 public function leaveSummary(Request $r){
  $d=$r->validate(['employee_id'=>'required|integer|exists:hr_employees,id','year'=>'required|integer|min:2000|max:2100']);
  $start=Carbon::create((int)$d['year'],1,1)->startOfDay();
  $end=$start->copy()->endOfYear()->startOfDay();
  $requests=HrLeaveRequest::where('employee_id',$d['employee_id'])->where('status','approved')
   ->whereDate('start_date','<=',$end->toDateString())->whereDate('end_date','>=',$start->toDateString())
   ->get(['leave_type','start_date','end_date']);
  $totals=[];
  foreach($requests as $leave){
   $from=$leave->start_date->greaterThan($start)?$leave->start_date:$start;
   $to=$leave->end_date->lessThan($end)?$leave->end_date:$end;
   $totals[$leave->leave_type]=($totals[$leave->leave_type]??0)+(int)$from->diffInDays($to)+1;
  }
  $entitlement=HrLeaveEntitlement::where('employee_id',$d['employee_id'])->where('year',$d['year'])->first();
  return response()->json(['employee_id'=>(int)$d['employee_id'],'year'=>(int)$d['year'],'approved_days'=>$totals,
   'annual_entitlement'=>$entitlement?->annual_days,
   'annual_remaining'=>$entitlement ? $entitlement->annual_days-($totals['annual']??0) : null]);
 }
 public function saveLeaveEntitlement(Request $r){
  $d=$r->validate(['employee_id'=>'required|integer|exists:hr_employees,id','year'=>'required|integer|min:2000|max:2100','annual_days'=>'required|integer|min:0|max:365']);
  $entitlement=HrLeaveEntitlement::updateOrCreate(
   ['employee_id'=>$d['employee_id'],'year'=>$d['year']],
   ['annual_days'=>$d['annual_days'],'updated_by'=>$r->user()?->id]
  );
  return response()->json(['success'=>true,'data'=>$entitlement]);
 }
 public function reviewCorrection(Request $r,HrAttendanceCorrectionRequest $request,AttendanceProcessor $processor){$d=$r->validate(['action'=>'required|in:approve,reject','notes'=>'nullable|string']);abort_unless($request->status==='pending',422,'تمت مراجعة الطلب مسبقاً.');DB::transaction(function()use($request,$d,$r,$processor){$request->update(['status'=>$d['action']==='approve'?'approved':'rejected','reviewed_by'=>$r->user()?->id,'review_notes'=>$d['notes']??null,'reviewed_at'=>now()]);if($d['action']==='approve'){$day=$request->work_date->toDateString();HrAttendanceEvent::where('employee_id',$request->employee_id)->where('source','manual')->whereDate('event_at',$day)->where('meta->correction_request_id',$request->id)->delete();if($request->requested_check_in)HrAttendanceEvent::create(['employee_id'=>$request->employee_id,'event_type'=>'check_in','event_at'=>$request->requested_check_in,'source'=>'manual','meta'=>['correction_request_id'=>$request->id]]);if($request->requested_check_out)HrAttendanceEvent::create(['employee_id'=>$request->employee_id,'event_type'=>'check_out','event_at'=>$request->requested_check_out,'source'=>'manual','meta'=>['correction_request_id'=>$request->id]]);$processor->rebuildDay(HrEmployee::findOrFail($request->employee_id),$day,$r->user()?->id);}});return response()->json(['success'=>true,'data'=>$request->fresh('employee')]);}
 public function reviewOvertime(Request $r,HrOvertimeRequest $request){$d=$r->validate(['action'=>'required|in:approve,reject','approved_minutes'=>'nullable|integer|min:0']);abort_unless($request->status==='pending',422,'تمت مراجعة الطلب مسبقاً.');DB::transaction(function()use($request,$d,$r){$minutes=$d['action']==='approve'?($d['approved_minutes']??$request->requested_minutes):0;$request->update(['status'=>$d['action']==='approve'?'approved':'rejected','approved_minutes'=>$minutes,'approved_by'=>$r->user()?->id,'approved_at'=>now()]);if($d['action']==='approve'){HrAttendanceDaily::where('employee_id',$request->employee_id)->whereDate('attendance_date',$request->work_date)->update(['overtime_minutes'=>$minutes]);HrAttendanceDailySummary::where('employee_id',$request->employee_id)->whereDate('work_date',$request->work_date)->update(['overtime_minutes'=>$minutes]);}});return response()->json(['success'=>true,'data'=>$request->fresh('employee')]);}
 public function reviewLeave(Request $r,HrLeaveRequest $request){$d=$r->validate(['action'=>'required|in:approve,reject']);abort_unless(in_array($request->status,['draft','pending'],true),422,'تمت مراجعة الطلب مسبقاً.');DB::transaction(function()use($request,$d,$r){$request->update(['status'=>$d['action']==='approve'?'approved':'rejected','approved_by'=>$r->user()?->id,'approved_at'=>now()]);if($d['action']==='approve')foreach(CarbonPeriod::create($request->start_date,$request->end_date) as $date){$day=$date->toDateString();HrAttendanceDaily::updateOrCreate(['employee_id'=>$request->employee_id,'attendance_date'=>$day],['status'=>'on_leave','source'=>'system','calculated_at'=>now(),'updated_by'=>$r->user()?->id]);HrAttendanceDailySummary::updateOrCreate(['employee_id'=>$request->employee_id,'work_date'=>$day],['status'=>'leave']);}});return response()->json(['success'=>true,'data'=>$request->fresh('employee')]);}
}
