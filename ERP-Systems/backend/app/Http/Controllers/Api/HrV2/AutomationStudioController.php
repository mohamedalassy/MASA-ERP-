<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrAutomationRule;use App\Models\HrAutomationRun;use App\Models\HrErpIntegrationEvent;
class AutomationStudioController extends Controller{
 public function index(){return response()->json(['rules'=>HrAutomationRule::orderBy('execution_order')->get(),'recent_runs'=>HrAutomationRun::latest()->limit(30)->get(),'integration_queue'=>HrErpIntegrationEvent::whereIn('status',['pending','failed'])->latest()->limit(30)->get()]);}
}