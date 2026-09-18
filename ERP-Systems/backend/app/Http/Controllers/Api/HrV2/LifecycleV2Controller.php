<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrEmployeeLifecycleEvent;use App\Models\HrEmployeeOnboarding;use Illuminate\Http\Request;
class LifecycleV2Controller extends Controller{
 public function index(Request $r){return response()->json(['onboarding'=>HrEmployeeOnboarding::with('employee:id,employee_number,first_name,last_name')->whereIn('status',['planned','in_progress'])->latest()->get(),'events'=>HrEmployeeLifecycleEvent::with('employee:id,employee_number,first_name,last_name')->latest()->limit(50)->get()]);}
}