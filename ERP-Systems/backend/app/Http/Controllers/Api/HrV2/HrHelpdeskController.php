<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrServiceRequest;use Illuminate\Http\Request;
class HrHelpdeskController extends Controller {
 public function index(Request $r){$q=HrServiceRequest::with('employee:id,employee_number,first_name,last_name');if($r->status)$q->where('status',$r->status);return response()->json($q->latest()->paginate($r->integer('per_page',50)));}
 public function update(Request $r,HrServiceRequest $serviceRequest){$d=$r->validate(['status'=>'sometimes|in:open,in_progress,waiting_employee,resolved,closed,cancelled','assigned_to'=>'nullable|exists:users,id']);if(($d['status']??null)==='resolved')$d['resolved_at']=now();$serviceRequest->update($d);return response()->json($serviceRequest);}
}