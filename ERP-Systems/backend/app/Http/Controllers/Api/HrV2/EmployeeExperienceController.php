<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrEmployee;use App\Models\HrAnnouncement;use App\Models\HrServiceRequest;
use App\Models\HrLetterRequest;use App\Models\HrLeaveRequest;use App\Models\HrAttendanceCorrectionRequest;use App\Models\HrSurvey;
use Illuminate\Http\Request;
class EmployeeExperienceController extends Controller {
 private function employee(Request $r){return HrEmployee::where('user_id',$r->user()?->id)->first();}
 public function portal(Request $r){
  $e=$this->employee($r);
  return response()->json([
   'employee'=>$e?->load(['branch:id,name','department:id,name','jobTitle:id,name','shift:id,name']),
   'announcements'=>HrAnnouncement::where(fn($q)=>$q->whereNull('publish_at')->orWhere('publish_at','<=',now()))->where(fn($q)=>$q->whereNull('expires_at')->orWhere('expires_at','>=',now()))->orderByDesc('is_pinned')->latest()->limit(10)->get(),
   'requests'=>$e?HrServiceRequest::where('employee_id',$e->id)->latest()->limit(10)->get():[],
   'letters'=>$e?HrLetterRequest::where('employee_id',$e->id)->latest()->limit(10)->get():[],
   'leaves'=>$e?HrLeaveRequest::where('employee_id',$e->id)->latest()->limit(10)->get():[],
   'corrections'=>$e?HrAttendanceCorrectionRequest::where('employee_id',$e->id)->latest()->limit(10)->get():[],
   'surveys'=>HrSurvey::where('status','active')->where(fn($q)=>$q->whereNull('start_date')->orWhereDate('start_date','<=',now()))->where(fn($q)=>$q->whereNull('end_date')->orWhereDate('end_date','>=',now()))->get()
  ]);
 }
 public function serviceRequest(Request $r){
  $e=$this->employee($r);abort_unless($e,422,'No employee linked to this user.');
  $d=$r->validate(['category'=>'required|string|max:60','subject'=>'required|string|max:255','description'=>'nullable|string','priority'=>'nullable|in:low,normal,high,urgent']);
  $d['employee_id']=$e->id;$d['request_number']='SR-'.now()->format('YmdHis').'-'.$e->id;
  return response()->json(HrServiceRequest::create($d),201);
 }
 public function letterRequest(Request $r){
  $e=$this->employee($r);abort_unless($e,422,'No employee linked to this user.');
  $d=$r->validate(['letter_type'=>'required|string|max:60','language'=>'nullable|in:ar,en','addressed_to'=>'nullable|string|max:255','purpose'=>'nullable|string']);
  $d['employee_id']=$e->id;$d['request_number']='LTR-'.now()->format('YmdHis').'-'.$e->id;
  return response()->json(HrLetterRequest::create($d),201);
 }
}