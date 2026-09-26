<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;
use App\Models\HrAttendanceDailySummary;
use App\Models\HrAttendanceCorrectionRequest;
use App\Models\HrAttendanceDevice;
use App\Models\HrEmployee;
use App\Models\HrLeaveRequest;
use App\Models\HrOvertimeRequest;
use App\Models\HrRoster;
use App\Services\Hr\AttendanceProcessor;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AttendanceCommandCenterController extends Controller {
 public function exportDay(Request $r){
  $data=$r->validate(['date'=>'required|date_format:Y-m-d']);
  $date=$data['date'];
  $labels=['present'=>'حاضر','late'=>'متأخر','absent'=>'غائب','incomplete'=>'سجل ناقص','leave'=>'إجازة','on_leave'=>'إجازة','day_off'=>'راحة','holiday'=>'عطلة'];
  return response()->streamDownload(function()use($date,$labels){
   $output=fopen('php://output','w');
   fwrite($output,"\xEF\xBB\xBF");
   fputcsv($output,['رقم الموظف','اسم الموظف','التاريخ','الحالة','الدخول','الخروج','دقائق العمل','دقائق التأخير','دقائق الانصراف المبكر','دقائق الإضافي']);
   HrAttendanceDailySummary::with('employee:id,employee_number,first_name,last_name')
    ->whereDate('work_date',$date)->orderBy('id')->chunkById(200,function($rows)use($output,$labels,$date){
     foreach($rows as $row){
      $employee=$row->employee;
      $safeNumber=(string)($employee?->employee_number??'');
      if(preg_match('/^[=+@\-\t\r]/u',$safeNumber))$safeNumber="'".$safeNumber;
      $safeName=trim(($employee?->first_name??'').' '.($employee?->last_name??''));
      if(preg_match('/^[=+@\-\t\r]/u',$safeName))$safeName="'".$safeName;
      fputcsv($output,[
       $safeNumber, $safeName, $date, $labels[$row->status]??$row->status,
       $row->first_in?->copy()->timezone('Asia/Riyadh')->format('H:i')??'',
       $row->last_out?->copy()->timezone('Asia/Riyadh')->format('H:i')??'',
       $row->worked_minutes??0,$row->late_minutes??0,$row->early_leave_minutes??0,$row->overtime_minutes??0,
      ]);
     }
    });
   fclose($output);
  },'MASA-Attendance-'.$date.'.csv',['Content-Type'=>'text/csv; charset=UTF-8']);
 }
 public function rebuildDay(Request $r,AttendanceProcessor $processor){
  $data=$r->validate(['date'=>'required|date_format:Y-m-d']);
  $date=$data['date'];
  $day=CarbonImmutable::createFromFormat('!Y-m-d',$date);
  if($day->gte(CarbonImmutable::now('Asia/Riyadh')->startOfDay()))
   throw ValidationException::withMessages(['date'=>['يمكن حساب الغياب بعد انتهاء اليوم فقط. اختر يومًا سابقًا.']]);
  $rosters=HrRoster::with('shift')->whereDate('work_date',$date)->get()->keyBy('employee_id');
  $employees=HrEmployee::with('shift')->where('status','active')->where('is_active',true)
   ->where(fn($q)=>$q->whereNotNull('shift_id')->orWhereIn('id',$rosters->keys()))
   ->limit(501)->get();
  if($employees->count()>500)
   throw ValidationException::withMessages(['date'=>['اليوم يتضمن أكثر من 500 موظف؛ راجع مسؤول النظام لتشغيل المعالجة المجدولة.']]);
  $result=['processed'=>0,'absent'=>0,'present'=>0,'incomplete'=>0,'leave'=>0];
  foreach($employees as $employee){
   if($employee->hire_date && $employee->hire_date->toDateString()>$date)continue;
   $roster=$rosters->get($employee->id);
   if($roster && $roster->status!=='scheduled')continue;
   if(!$roster && (!$employee->shift?->is_active || !in_array($day->dayOfWeek,array_map('intval',$employee->shift->working_days??[]),true)))continue;
   $daily=$processor->rebuildDay($employee,$date,$r->user()?->id);
   $result['processed']++;
   if($daily->status==='absent')$result['absent']++;
   elseif(in_array($daily->status,['present','late'],true))$result['present']++;
   elseif($daily->status==='incomplete')$result['incomplete']++;
   elseif($daily->status==='on_leave')$result['leave']++;
  }
  return response()->json($result);
 }
 public function index(Request $r){
  $date=$r->date('date')?->toDateString() ?? now()->toDateString();
  $q=HrAttendanceDailySummary::whereDate('work_date',$date);
  $detail=$r->query('detail');
  $rows=HrAttendanceDailySummary::with('employee:id,employee_number,first_name,last_name,department_id')->whereDate('work_date',$date);
  if ($detail === 'present') $rows->whereIn('status',['present','late']);
  elseif ($detail === 'late') $rows->where('late_minutes','>',0);
  elseif ($detail === 'absent') $rows->where('status','absent');
  elseif ($detail === 'incomplete') $rows->where('status','incomplete');
  elseif ($detail === 'overtime') $rows->where('overtime_minutes','>',0);
  elseif ($detail === 'leave') $rows->whereIn('status',['leave','on_leave']);
  return response()->json([
   'date'=>$date,
   'kpis'=>[
    'employees'=>HrEmployee::where('status','active')->count(),
    'present'=>(clone $q)->whereIn('status',['present','late'])->count(),
    'late'=>(clone $q)->where('late_minutes','>',0)->count(),
    'absent'=>(clone $q)->where('status','absent')->count(),
    'leave'=>(clone $q)->whereIn('status',['leave','on_leave'])->count(),
    'incomplete'=>(clone $q)->where('status','incomplete')->count(),
    'overtime_minutes'=>(clone $q)->sum('overtime_minutes'),
   ],
   'pending'=>[
    'corrections'=>HrAttendanceCorrectionRequest::where('status','pending')->count(),
    'overtime'=>HrOvertimeRequest::where('status','pending')->count(),
    'leaves'=>HrLeaveRequest::where('status','pending')->count(),
   ],
   'devices'=>[
    'total'=>HrAttendanceDevice::where('is_active',true)->count(),
    'online'=>HrAttendanceDevice::where('is_active',true)->where('status','online')->count(),
    'errors'=>HrAttendanceDevice::where('is_active',true)->where('status','error')->count(),
   ],
   'rows'=>$rows->orderByDesc('late_minutes')->when(!$detail, fn ($query) => $query->limit(100))->get()
  ]);
 }
}
