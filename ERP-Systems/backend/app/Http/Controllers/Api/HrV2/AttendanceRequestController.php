<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrAttendanceCorrectionRequest; use App\Models\HrOvertimeRequest; use App\Models\HrLeaveRequest; use Illuminate\Http\Request;
class AttendanceRequestController extends Controller {
 public function corrections(Request $r){return response()->json(HrAttendanceCorrectionRequest::with('employee')->latest()->paginate($r->integer('per_page',50)));}
 public function overtime(Request $r){return response()->json(HrOvertimeRequest::with('employee')->latest()->paginate($r->integer('per_page',50)));}
 public function leaves(Request $r){return response()->json(HrLeaveRequest::with('employee')->latest()->paginate($r->integer('per_page',50)));}
}