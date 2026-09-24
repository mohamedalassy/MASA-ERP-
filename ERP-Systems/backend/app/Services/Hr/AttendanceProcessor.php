<?php
namespace App\Services\Hr;
use App\Models\HrAttendanceDaily;use App\Models\HrAttendanceDailySummary;use App\Models\HrAttendanceEvent;use App\Models\HrEmployee;use App\Models\HrRoster;use Carbon\Carbon;use Illuminate\Support\Facades\DB;
class AttendanceProcessor{
 public function rebuildDay(HrEmployee $employee,string $date,?int $userId=null):HrAttendanceDaily{
  $day=Carbon::parse($date)->startOfDay();$roster=HrRoster::with('shift')->where('employee_id',$employee->id)->whereDate('work_date',$day)->first();$shift=$roster?->shift?:$employee->shift;
  $status=match($roster?->status){'day_off'=>'weekend','leave'=>'on_leave','holiday'=>'holiday',default=>null};
  $events=HrAttendanceEvent::where('employee_id',$employee->id)->whereBetween('event_at',[$day->copy()->startOfDay(),$day->copy()->addDay()->endOfDay()])->orderBy('event_at')->get();
  $first=$events->firstWhere('event_type','check_in')?->event_at;$last=$events->where('event_type','check_out')->last()?->event_at;$scheduledStart=null;$scheduledEnd=null;
  if($shift){$start=$roster?->planned_start?:$shift->start_time;$end=$roster?->planned_end?:$shift->end_time;$scheduledStart=Carbon::parse($date.' '.$start);$scheduledEnd=Carbon::parse($date.' '.$end);if($shift->crosses_midnight||$scheduledEnd->lte($scheduledStart))$scheduledEnd->addDay();}
  $worked=0;$late=0;$early=0;$ot=0;
  if($first&&$last&&Carbon::parse($last)->gt(Carbon::parse($first))){$worked=max(0,Carbon::parse($first)->diffInMinutes(Carbon::parse($last))-(int)($shift?->break_minutes??0));if($scheduledStart)$late=max(0,$scheduledStart->diffInMinutes(Carbon::parse($first),false)-(int)($shift?->late_grace_minutes??0));if($scheduledEnd)$early=max(0,Carbon::parse($last)->diffInMinutes($scheduledEnd,false)-(int)($shift?->early_leave_grace_minutes??0));if($shift?->overtime_allowed)$ot=max(0,$worked-((int)($shift->required_minutes??480)+(int)($shift->overtime_after_minutes??0)));}
  if(!$status){if(!$first&&!$last)$status='absent';elseif(!$first||!$last)$status='incomplete';elseif($late>0)$status='late';else$status='present';}
  return DB::transaction(function()use($employee,$date,$shift,$first,$last,$scheduledStart,$scheduledEnd,$worked,$late,$early,$ot,$status,$userId){
   $daily=HrAttendanceDaily::updateOrCreate(['employee_id'=>$employee->id,'attendance_date'=>$date],['shift_id'=>$shift?->id,'branch_id'=>$employee->branch_id,'first_in_at'=>$first,'last_out_at'=>$last,'scheduled_start_at'=>$scheduledStart,'scheduled_end_at'=>$scheduledEnd,'worked_minutes'=>$worked,'late_minutes'=>$late,'early_leave_minutes'=>$early,'overtime_minutes'=>$ot,'status'=>$status,'source'=>'system','calculated_at'=>now(),'updated_by'=>$userId]);
   HrAttendanceDailySummary::updateOrCreate(['employee_id'=>$employee->id,'work_date'=>$date],['first_in'=>$first,'last_out'=>$last,'worked_minutes'=>$worked,'late_minutes'=>$late,'early_leave_minutes'=>$early,'overtime_minutes'=>$ot,'status'=>match($status){'on_leave'=>'leave','weekend'=>'day_off',default=>$status}]);return $daily;
  });
 }
}