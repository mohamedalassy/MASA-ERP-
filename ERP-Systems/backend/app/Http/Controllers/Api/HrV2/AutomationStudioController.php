<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrAutomationRule;use App\Models\HrAutomationRun;use App\Models\HrErpIntegrationEvent;use Illuminate\Http\Request;
class AutomationStudioController{
 public function index(){return response()->json(['rules'=>HrAutomationRule::orderBy('execution_order')->get(),'recent_runs'=>HrAutomationRun::latest()->limit(30)->get(),'integration_queue'=>HrErpIntegrationEvent::whereIn('status',['pending','failed'])->latest()->limit(30)->get()]);}
 public function store(Request $r){$d=$r->validate(['code'=>'required|string|max:80|unique:hr_automation_rules,code','name'=>'required|string|max:255','trigger_event'=>'required|string|max:100','conditions'=>'nullable|array','actions'=>'required|array','execution_order'=>'nullable|integer|min:0','is_active'=>'nullable|boolean']);return response()->json(HrAutomationRule::create($d),201);}
 public function update(Request $r,HrAutomationRule $rule){$d=$r->validate(['name'=>'sometimes|string|max:255','conditions'=>'nullable|array','actions'=>'sometimes|array','execution_order'=>'nullable|integer|min:0','is_active'=>'nullable|boolean']);$rule->update($d);return response()->json($rule);}
}