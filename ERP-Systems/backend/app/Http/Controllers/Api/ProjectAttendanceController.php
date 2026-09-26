<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HrEmployee;
use App\Models\Project;
use App\Models\ProjectAttendanceLog;
use App\Models\ProjectTeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProjectAttendanceController extends Controller
{
    private function employeeFor(Request $request): ?HrEmployee
    {
        $user=$request->user();
        if(!$user)return null;
        return HrEmployee::query()
            ->where('user_id',$user->id)
            ->where('is_active',true)
            ->whereIn('status',['active','on_leave'])
            ->first();
    }

    public function me(Request $request,Project $project): JsonResponse
    {
        $employee=$this->employeeFor($request);
        if(!$employee)return response()->json(['success'=>false,'message'=>'حسابك غير مرتبط بملف موظف فعال في MASA People.'],403);

        $member=ProjectTeamMember::query()
            ->where('project_id',$project->id)->where('employee_id',$employee->id)
            ->with(['employee.branch:id,code,name','employee.department:id,code,name','employee.jobTitle:id,code,name'])
            ->first();

        if(!$member)return response()->json(['success'=>false,'message'=>'أنت غير مضاف إلى فريق هذا المشروع.'],403);

        $latest=ProjectAttendanceLog::query()
            ->where('project_id',$project->id)->where('employee_id',$employee->id)
            ->latest('recorded_at')->first();

        return response()->json(['success'=>true,'data'=>[
            'employee'=>$employee,
            'member'=>$member,
            'attendance_allowed'=>$member->is_active&&$member->attendance_enabled,
            'is_onsite'=>$latest?->event_type==='check_in',
            'next_event'=>$latest?->event_type==='check_in'?'check_out':'check_in',
            'latest_event'=>$latest,
        ]]);
    }

    public function index(Request $request,Project $project): JsonResponse
    {
        $q=ProjectAttendanceLog::where('project_id',$project->id)
            ->with('employee:id,employee_number,first_name,middle_name,last_name');
        if($request->filled('employee_id'))$q->where('employee_id',$request->integer('employee_id'));
        if($request->filled('date'))$q->whereDate('recorded_at',$request->input('date'));
        return response()->json(['success'=>true,'data'=>$q->latest('recorded_at')->paginate($request->integer('per_page',100))]);
    }

    public function onsite(Project $project): JsonResponse
    {
        $members=ProjectTeamMember::where('project_id',$project->id)->where('is_active',true)
            ->with('employee:id,employee_number,first_name,middle_name,last_name')->get();
        $data=$members->filter(function($m)use($project){
            $last=ProjectAttendanceLog::where('project_id',$project->id)->where('employee_id',$m->employee_id)->latest('recorded_at')->first();
            if(!$last||$last->event_type!=='check_in')return false;
            $m->setAttribute('last_attendance_event',$last);return true;
        })->values();
        return response()->json(['success'=>true,'data'=>$data]);
    }

    public function punch(Request $request,Project $project): JsonResponse
    {
        $data=$request->validate([
            'event_type'=>['required',Rule::in(['check_in','check_out'])],
            'latitude'=>['required','numeric','between:-90,90'],
            'longitude'=>['required','numeric','between:-180,180'],
            'accuracy_meters'=>['nullable','numeric','min:0','max:10000'],
        ]);

        $employee=$this->employeeFor($request);
        if(!$employee)return response()->json(['success'=>false,'message'=>'حسابك غير مرتبط بملف موظف فعال في MASA People.'],403);
        if($project->latitude===null||$project->longitude===null)
            return response()->json(['success'=>false,'message'=>'إحداثيات موقع المشروع غير محددة.'],422);

        $radius=max(1,(int)($project->attendance_radius?:100));
        $distance=$this->distance((float)$project->latitude,(float)$project->longitude,(float)$data['latitude'],(float)$data['longitude']);
        if($distance>$radius)return response()->json(['success'=>false,'message'=>'أنت خارج نطاق الحضور المسموح للمشروع.','data'=>['distance_meters'=>round($distance,2),'geofence_radius'=>$radius]],422);

        $log=DB::transaction(function()use($request,$project,$employee,$data,$radius,$distance){
            $member=ProjectTeamMember::where('project_id',$project->id)->where('employee_id',$employee->id)->lockForUpdate()->first();
            abort_unless($member&&$member->is_active,403,'أنت غير مضاف إلى فريق هذا المشروع أو أن التكليف غير نشط.');
            abort_unless($member->attendance_enabled,403,'تسجيل الحضور غير مفعل لك في هذا المشروع.');
            $today=now()->toDateString();
            if($member->start_date&&$today<$member->start_date->toDateString())abort(403,'لم يبدأ تكليفك بهذا المشروع بعد.');
            if($member->end_date&&$today>$member->end_date->toDateString())abort(403,'انتهى تكليفك بهذا المشروع.');

            $last=ProjectAttendanceLog::where('project_id',$project->id)->where('employee_id',$employee->id)
                ->latest('recorded_at')->lockForUpdate()->first();
            if($data['event_type']==='check_in'&&$last?->event_type==='check_in')abort(422,'أنت مسجل حضور بالفعل ولم تسجل انصراف.');
            if($data['event_type']==='check_out'&&(!$last||$last->event_type!=='check_in'))abort(422,'لا يوجد تسجيل حضور مفتوح لك.');

            return ProjectAttendanceLog::create([
                'project_id'=>$project->id,'project_team_member_id'=>$member->id,'employee_id'=>$employee->id,
                'event_type'=>$data['event_type'],'recorded_at'=>now(),
                'latitude'=>$data['latitude'],'longitude'=>$data['longitude'],
                'accuracy_meters'=>$data['accuracy_meters']??null,'distance_meters'=>round($distance,2),
                'geofence_radius'=>$radius,'inside_geofence'=>true,'source'=>'project_gps',
                'ip_address'=>$request->ip(),'user_agent'=>$request->userAgent(),
                'metadata'=>['authenticated_user_id'=>$request->user()->id],
            ]);
        });

        return response()->json(['success'=>true,
            'message'=>$data['event_type']==='check_in'?'تم تسجيل حضورك بنجاح.':'تم تسجيل انصرافك بنجاح.',
            'data'=>$log->load('employee')],201);
    }

    private function distance(float $lat1,float $lon1,float $lat2,float $lon2):float
    {
        $r=6371000.0;$p1=deg2rad($lat1);$p2=deg2rad($lat2);
        $dp=deg2rad($lat2-$lat1);$dl=deg2rad($lon2-$lon1);
        $a=sin($dp/2)**2+cos($p1)*cos($p2)*sin($dl/2)**2;
        return $r*2*atan2(sqrt($a),sqrt(1-$a));
    }
}