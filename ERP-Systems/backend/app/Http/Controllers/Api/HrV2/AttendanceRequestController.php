<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrAttendanceCorrectionRequest;use App\Models\HrAttendanceDaily;use App\Models\HrAttendanceDailySummary;use App\Models\HrAttendanceEvent;use App\Models\HrEmployee;use App\Models\HrLeaveEntitlement;use App\Models\HrLeaveRequest;use App\Models\HrOvertimeRequest;use App\Services\Hr\AttendanceProcessor;use Carbon\Carbon;use Carbon\CarbonPeriod;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;use Illuminate\Validation\ValidationException;
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
  $entitlement=DB::transaction(function()use($d,$r){
   HrEmployee::whereKey($d['employee_id'])->lockForUpdate()->firstOrFail();
   $used=$this->annualApprovedDays($d['employee_id'],(int)$d['year']);
   if($d['annual_days']<$used) throw ValidationException::withMessages(['annual_days'=>["لا يمكن تحديد استحقاق أقل من {$used} يوم معتمد في هذه السنة."]]);
   return HrLeaveEntitlement::updateOrCreate(
    ['employee_id'=>$d['employee_id'],'year'=>$d['year']],
    ['annual_days'=>$d['annual_days'],'updated_by'=>$r->user()?->id]
   );
  });
  return response()->json(['success'=>true,'data'=>$entitlement]);
 }
 private function annualApprovedDays(int $employeeId,int $year):int{
  $start=Carbon::create($year,1,1)->startOfDay();
  $end=$start->copy()->endOfYear()->startOfDay();
  return HrLeaveRequest::where('employee_id',$employeeId)->where('leave_type','annual')->where('status','approved')
   ->whereDate('start_date','<=',$end->toDateString())->whereDate('end_date','>=',$start->toDateString())
   ->get(['start_date','end_date'])->sum(function($leave)use($start,$end){
    $from=$leave->start_date->greaterThan($start)?$leave->start_date:$start;
    $to=$leave->end_date->lessThan($end)?$leave->end_date:$end;
    return (int)$from->diffInDays($to)+1;
   });
 }
 public function reviewCorrection(Request $r,HrAttendanceCorrectionRequest $request,AttendanceProcessor $processor){$d=$r->validate(['action'=>'required|in:approve,reject','notes'=>'nullable|string']);abort_unless($request->status==='pending',422,'تمت مراجعة الطلب مسبقاً.');DB::transaction(function()use($request,$d,$r,$processor){$request->update(['status'=>$d['action']==='approve'?'approved':'rejected','reviewed_by'=>$r->user()?->id,'review_notes'=>$d['notes']??null,'reviewed_at'=>now()]);if($d['action']==='approve'){$day=$request->work_date->toDateString();HrAttendanceEvent::where('employee_id',$request->employee_id)->where('source','manual')->whereDate('event_at',$day)->where('meta->correction_request_id',$request->id)->delete();if($request->requested_check_in)HrAttendanceEvent::create(['employee_id'=>$request->employee_id,'event_type'=>'check_in','event_at'=>$request->requested_check_in,'source'=>'manual','meta'=>['correction_request_id'=>$request->id]]);if($request->requested_check_out)HrAttendanceEvent::create(['employee_id'=>$request->employee_id,'event_type'=>'check_out','event_at'=>$request->requested_check_out,'source'=>'manual','meta'=>['correction_request_id'=>$request->id]]);$processor->rebuildDay(HrEmployee::findOrFail($request->employee_id),$day,$r->user()?->id);}});return response()->json(['success'=>true,'data'=>$request->fresh('employee')]);}
 public function reviewOvertime(Request $r,HrOvertimeRequest $request){$d=$r->validate(['action'=>'required|in:approve,reject','approved_minutes'=>'nullable|integer|min:0']);abort_unless($request->status==='pending',422,'تمت مراجعة الطلب مسبقاً.');DB::transaction(function()use($request,$d,$r){$minutes=$d['action']==='approve'?($d['approved_minutes']??$request->requested_minutes):0;$request->update(['status'=>$d['action']==='approve'?'approved':'rejected','approved_minutes'=>$minutes,'approved_by'=>$r->user()?->id,'approved_at'=>now()]);if($d['action']==='approve'){HrAttendanceDaily::where('employee_id',$request->employee_id)->whereDate('attendance_date',$request->work_date)->update(['overtime_minutes'=>$minutes]);HrAttendanceDailySummary::where('employee_id',$request->employee_id)->whereDate('work_date',$request->work_date)->update(['overtime_minutes'=>$minutes]);}});return response()->json(['success'=>true,'data'=>$request->fresh('employee')]);}
 public function reviewLeave(Request $r,HrLeaveRequest $request){
  $d=$r->validate(['action'=>'required|in:approve,reject']);
  $result=DB::transaction(function()use($request,$d,$r){
   HrEmployee::whereKey($request->employee_id)->lockForUpdate()->firstOrFail();
   $request=HrLeaveRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
   abort_unless(in_array($request->status,['draft','pending'],true),422,'تمت مراجعة الطلب مسبقاً.');
   if($d['action']==='approve'){
    $start=$request->start_date->toDateString();
    $end=$request->end_date->toDateString();
    if($request->leave_type==='annual'){
     for($year=(int)$request->start_date->year;$year<=(int)$request->end_date->year;$year++){
      $entitlement=HrLeaveEntitlement::where('employee_id',$request->employee_id)->where('year',$year)->first();
      if(!$entitlement) throw ValidationException::withMessages(['leave'=>["حدد استحقاق الإجازة السنوية لسنة {$year} قبل الاعتماد."]]);
      $yearStart=Carbon::create($year,1,1)->startOfDay();
      $yearEnd=$yearStart->copy()->endOfYear()->startOfDay();
      $from=$request->start_date->greaterThan($yearStart)?$request->start_date:$yearStart;
      $to=$request->end_date->lessThan($yearEnd)?$request->end_date:$yearEnd;
      $requested=(int)$from->diffInDays($to)+1;
      if($this->annualApprovedDays($request->employee_id,$year)+$requested>$entitlement->annual_days)
       throw ValidationException::withMessages(['leave'=>["رصيد الإجازة السنوية لسنة {$year} غير كافٍ لاعتماد الطلب."]]);
     }
    }
    $hasDaily=HrAttendanceDaily::where('employee_id',$request->employee_id)
     ->whereBetween('attendance_date',[$start,$end])
     ->where(fn($q)=>$q->whereNotNull('first_in_at')->orWhereNotNull('last_out_at'))->exists();
    $hasSummary=HrAttendanceDailySummary::where('employee_id',$request->employee_id)
     ->whereBetween('work_date',[$start,$end])
     ->where(fn($q)=>$q->whereNotNull('first_in')->orWhereNotNull('last_out'))->exists();
    $hasEvents=HrAttendanceEvent::where('employee_id',$request->employee_id)
     ->where('event_at','>=',$start.' 00:00:00')->where('event_at','<',Carbon::parse($end)->addDay()->toDateString().' 00:00:00')->exists();
    if($hasDaily||$hasSummary||$hasEvents)
     throw ValidationException::withMessages(['leave'=>['توجد بصمة أو حضور مسجّل في فترة الإجازة؛ راجع السجل قبل الاعتماد.']]);
   }
   $request->update(['status'=>$d['action']==='approve'?'approved':'rejected','approved_by'=>$r->user()?->id,'approved_at'=>now()]);
   if($d['action']==='approve')foreach(CarbonPeriod::create($request->start_date,$request->end_date) as $date){
    $day=$date->toDateString();
    HrAttendanceDaily::updateOrCreate(['employee_id'=>$request->employee_id,'attendance_date'=>$day],['status'=>'on_leave','source'=>'system','calculated_at'=>now(),'updated_by'=>$r->user()?->id]);
    HrAttendanceDailySummary::updateOrCreate(['employee_id'=>$request->employee_id,'work_date'=>$day],['status'=>'leave']);
   }
   return $request->fresh('employee');
  });
  return response()->json(['success'=>true,'data'=>$result]);
 }
 public function cancelLeave(HrLeaveRequest $request){
  $result=DB::transaction(function()use($request){
   HrEmployee::whereKey($request->employee_id)->lockForUpdate()->firstOrFail();
   $request=HrLeaveRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
   abort_unless(in_array($request->status,['pending','approved'],true),422,'لا يمكن إلغاء هذا الطلب.');
   if($request->status==='approved'){
    if($request->start_date->toDateString()<Carbon::now('Asia/Riyadh')->toDateString())
     throw ValidationException::withMessages(['leave'=>['لا يمكن إلغاء إجازة معتمدة بتاريخ سابق؛ راجع الموارد البشرية لتسوية السجل.']]);
    $start=$request->start_date->toDateString();
    $end=$request->end_date->toDateString();
    $hasEvents=HrAttendanceEvent::where('employee_id',$request->employee_id)
     ->where('event_at','>=',$start.' 00:00:00')->where('event_at','<',Carbon::parse($end)->addDay()->toDateString().' 00:00:00')->exists();
    $hasOtherDaily=HrAttendanceDaily::where('employee_id',$request->employee_id)
     ->whereBetween('attendance_date',[$start,$end])
     ->where(fn($q)=>$q->where('status','!=','on_leave')->orWhere('source','!=','system')->orWhereNotNull('first_in_at')->orWhereNotNull('last_out_at'))->exists();
    $hasOtherSummary=HrAttendanceDailySummary::where('employee_id',$request->employee_id)
     ->whereBetween('work_date',[$start,$end])
     ->where(fn($q)=>$q->where('status','!=','leave')->orWhereNotNull('first_in')->orWhereNotNull('last_out'))->exists();
    if($hasEvents||$hasOtherDaily||$hasOtherSummary)
     throw ValidationException::withMessages(['leave'=>['سجلات الحضور تغيرت بعد الاعتماد؛ راجعها قبل إلغاء الإجازة.']]);
    HrAttendanceDaily::where('employee_id',$request->employee_id)->whereBetween('attendance_date',[$start,$end])->where('status','on_leave')->where('source','system')->delete();
    HrAttendanceDailySummary::where('employee_id',$request->employee_id)->whereBetween('work_date',[$start,$end])->where('status','leave')->delete();
   }
   $request->update(['status'=>'cancelled']);
   return $request->fresh('employee');
  });
  return response()->json(['success'=>true,'data'=>$result]);
 }
}
