<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrEmployee;use Illuminate\Support\Facades\Schema;
class Employee360Controller extends Controller{
 public function show(HrEmployee $hrEmployee){
  $relations=['user','branch','department','jobTitle','shift','manager','contracts','documents'];
  foreach(['governmentRecords'=>'hr_employee_government_records','compensations'=>'hr_employee_compensations','attendanceSummaries'=>'hr_attendance_daily_summaries','leaveRequests'=>'hr_leave_requests','overtimeRequests'=>'hr_overtime_requests','lifecycleEvents'=>'hr_employee_lifecycle_events','skills'=>'hr_employee_skills','learningEnrollments'=>'hr_learning_enrollments','performanceReviews'=>'hr_performance_reviews'] as $relation=>$table)if(Schema::hasTable($table))$relations[]=$relation;
  $employee=$hrEmployee->load($relations);
  return response()->json(['employee'=>$employee,'summary'=>[
   'contracts'=>$employee->contracts->count(),'documents'=>$employee->documents->count(),
   'expiring_documents'=>$employee->documents->filter(fn($d)=>$d->expiry_date&&$d->expiry_date->between(now(),now()->addDays(60)))->count(),
   'attendance_30d'=>Schema::hasTable('hr_attendance_daily_summaries')?$hrEmployee->attendanceSummaries()->whereDate('work_date','>=',now()->subDays(30))->get(['status','worked_minutes','late_minutes','overtime_minutes']):[],
   'pending_leaves'=>Schema::hasTable('hr_leave_requests')?$hrEmployee->leaveRequests()->where('status','pending')->count():0,
   'pending_overtime'=>Schema::hasTable('hr_overtime_requests')?$hrEmployee->overtimeRequests()->where('status','pending')->count():0,
  ]]);
 }
}