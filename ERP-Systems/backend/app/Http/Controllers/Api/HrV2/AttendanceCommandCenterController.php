<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;
use App\Models\HrAttendanceDailySummary;
use App\Models\HrAttendanceCorrectionRequest;
use App\Models\HrAttendanceDevice;
use App\Models\HrEmployee;
use App\Models\HrLeaveRequest;
use App\Models\HrOvertimeRequest;
use Illuminate\Http\Request;

class AttendanceCommandCenterController extends Controller {
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
