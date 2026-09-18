<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrApprovalRequest;use Illuminate\Http\Request;use Illuminate\Support\Facades\DB;
class ApprovalCenterController extends Controller{
 public function index(Request $r){$q=HrApprovalRequest::with(['employee:id,first_name,last_name','steps']);if($r->status)$q->where('status',$r->status);return response()->json($q->latest()->paginate($r->integer('per_page',50)));}
 public function action(Request $r,HrApprovalRequest $approvalRequest){
  $d=$r->validate(['action'=>'required|in:approve,reject','comment'=>'nullable|string']);abort_unless($approvalRequest->status==='pending',422,'Request is not pending.');
  DB::transaction(function()use($approvalRequest,$d){
   $step=$approvalRequest->steps()->where('step_number',$approvalRequest->current_step)->firstOrFail();
   $step->update(['status'=>$d['action']==='approve'?'approved':'rejected','comment'=>$d['comment']??null,'acted_at'=>now()]);
   if($d['action']==='reject'){$approvalRequest->update(['status'=>'rejected','completed_at'=>now()]);return;}
   $next=$approvalRequest->steps()->where('step_number','>',$approvalRequest->current_step)->orderBy('step_number')->first();
   $next?$approvalRequest->update(['current_step'=>$next->step_number]):$approvalRequest->update(['status'=>'approved','completed_at'=>now()]);
  });return response()->json($approvalRequest->fresh('steps'));
 }
}