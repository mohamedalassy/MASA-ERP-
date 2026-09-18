<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrEmployee; use App\Models\HrBranch; use App\Models\HrPosition; use App\Models\HrComplianceException; use App\Models\HrGovernmentConnector;
class PeopleCommandCenterController extends Controller {
 public function index(){return response()->json([
 'people'=>['total'=>HrEmployee::count(),'active'=>HrEmployee::where('status','active')->count(),'on_leave'=>HrEmployee::where('status','on_leave')->count(),'biometric_ready'=>HrEmployee::whereNotNull('biometric_user_id')->count()],
 'organization'=>['branches'=>HrBranch::where('is_active',true)->count(),'positions'=>HrPosition::where('is_active',true)->count()],
 'compliance'=>['open'=>HrComplianceException::whereIn('status',['open','acknowledged'])->count(),'critical'=>HrComplianceException::whereIn('status',['open','acknowledged'])->where('severity','critical')->count()],
 'government'=>['connectors'=>HrGovernmentConnector::where('is_active',true)->count(),'connected'=>HrGovernmentConnector::where('status','connected')->count()],
 'recent_employees'=>HrEmployee::with(['branch:id,name','department:id,name','jobTitle:id,name'])->latest()->limit(6)->get(),
 'exceptions'=>HrComplianceException::with('employee:id,first_name,last_name')->whereIn('status',['open','acknowledged'])->latest()->limit(8)->get()
 ]);}
}