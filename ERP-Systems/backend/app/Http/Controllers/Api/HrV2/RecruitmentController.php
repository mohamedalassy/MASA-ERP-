<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrRequisition;use App\Models\HrCandidate;use App\Models\HrApplication;use Illuminate\Http\Request;
class RecruitmentController extends Controller{
 public function dashboard(){return response()->json(['open_requisitions'=>HrRequisition::where('status','open')->count(),'active_candidates'=>HrCandidate::whereIn('status',['new','active'])->count(),'active_applications'=>HrApplication::where('status','active')->count(),'offers'=>HrApplication::where('status','offer')->count(),'requisitions'=>HrRequisition::withCount('applications')->latest()->limit(20)->get(),'pipeline'=>HrApplication::selectRaw('stage,count(*) total')->where('status','active')->groupBy('stage')->get()]);}
 public function candidates(Request $r){$q=HrCandidate::query();if($r->search)$q->where(fn($x)=>$x->where('first_name','like',"%{$r->search}%")->orWhere('last_name','like',"%{$r->search}%")->orWhere('email','like',"%{$r->search}%"));return response()->json($q->latest()->paginate($r->integer('per_page',50)));}
}