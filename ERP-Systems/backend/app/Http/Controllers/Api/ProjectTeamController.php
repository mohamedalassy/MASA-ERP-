<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\HrEmployee;
use App\Models\Project;
use App\Models\ProjectTeamMember;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
class ProjectTeamController extends Controller {
 public function index(Project $project){
  return response()->json(['success'=>true,'data'=>ProjectTeamMember::where('project_id',$project->id)
   ->with(['employee.branch:id,code,name','employee.department:id,code,name','employee.jobTitle:id,code,name'])->latest()->get()]);
 }
 public function employees(Request $request){
  $q=HrEmployee::with(['branch:id,code,name','department:id,code,name','jobTitle:id,code,name'])->where('is_active',true)->whereIn('status',['active','on_leave']);
  if($request->filled('search')){$s=$request->string('search');$q->where(fn($x)=>$x->where('employee_number','like',"%{$s}%")->orWhere('first_name','like',"%{$s}%")->orWhere('middle_name','like',"%{$s}%")->orWhere('last_name','like',"%{$s}%")->orWhere('mobile','like',"%{$s}%"));}
  return response()->json(['success'=>true,'data'=>$q->orderBy('first_name')->limit(100)->get()]);
 }
 public function store(Request $request,Project $project){
  $data=$request->validate([
   'employee_id'=>['required','integer','exists:hr_employees,id',Rule::unique('project_team_members','employee_id')->where(fn($q)=>$q->where('project_id',$project->id))],
   'role'=>['nullable','string','max:120'],'start_date'=>['nullable','date'],'end_date'=>['nullable','date','after_or_equal:start_date'],
   'attendance_enabled'=>['nullable','boolean'],'notes'=>['nullable','string','max:2000'],
  ]);
  $member=ProjectTeamMember::create([...$data,'project_id'=>$project->id,'attendance_enabled'=>$data['attendance_enabled']??true,'is_active'=>true,'assigned_by'=>$request->user()?->id]);
  AuditLog::create(['user_id'=>$request->user()?->id,'action'=>'project_team_member_added','module'=>'project','record_id'=>$project->id,'title'=>'تمت إضافة موظف لفريق المشروع','description'=>'تمت إضافة موظف إلى فريق المشروع.','new_values'=>['project_team_member_id'=>$member->id,'employee_id'=>$data['employee_id']],'ip_address'=>$request->ip(),'user_agent'=>$request->userAgent()]);
  return response()->json(['success'=>true,'message'=>'تمت إضافة الموظف لفريق المشروع.','data'=>$member->load(['employee.branch','employee.department','employee.jobTitle'])],201);
 }
 public function update(Request $request,Project $project,ProjectTeamMember $member){
  abort_unless($member->project_id===$project->id,404);
  $data=$request->validate(['role'=>['nullable','string','max:120'],'start_date'=>['nullable','date'],'end_date'=>['nullable','date','after_or_equal:start_date'],'attendance_enabled'=>['nullable','boolean'],'is_active'=>['nullable','boolean'],'notes'=>['nullable','string','max:2000']]);
  $member->update($data); return response()->json(['success'=>true,'message'=>'تم تحديث عضو الفريق.','data'=>$member->fresh()->load('employee')]);
 }
 public function destroy(Project $project,ProjectTeamMember $member){
  abort_unless($member->project_id===$project->id,404);$member->delete();
  return response()->json(['success'=>true,'message'=>'تمت إزالة الموظف من فريق المشروع.']);
 }
}