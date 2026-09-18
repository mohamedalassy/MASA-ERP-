<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Models\HrGovernmentConnector;use App\Models\HrGovernmentTransaction;
class GovernmentHubV2Controller extends Controller{
 public function index(){return response()->json([
  'connectors'=>HrGovernmentConnector::with(['transactions'=>fn($q)=>$q->latest()->limit(5)])->withCount('transactions')->get(),
  'transactions'=>HrGovernmentTransaction::with(['connector:id,code,name','employee:id,first_name,last_name'])->latest()->limit(30)->get()
 ]);}
}