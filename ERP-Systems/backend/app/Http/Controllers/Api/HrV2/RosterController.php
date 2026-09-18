<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrRoster; use Illuminate\Http\Request;
class RosterController extends Controller {
 public function index(Request $r){$q=HrRoster::with(['employee:id,employee_number,first_name,last_name','shift:id,code,name,start_time,end_time']);if($r->from)$q->whereDate('work_date','>=',$r->from);if($r->to)$q->whereDate('work_date','<=',$r->to);return response()->json($q->orderBy('work_date')->paginate($r->integer('per_page',100)));}
 public function store(Request $r){$d=$r->validate(['employee_id'=>'required|exists:hr_employees,id','shift_id'=>'nullable|exists:hr_shifts,id','work_date'=>'required|date','planned_start'=>'nullable','planned_end'=>'nullable','status'=>'required|in:scheduled,day_off,leave,holiday,cancelled','notes'=>'nullable|string']);return response()->json(HrRoster::updateOrCreate(['employee_id'=>$d['employee_id'],'work_date'=>$d['work_date']],$d),201);}
}