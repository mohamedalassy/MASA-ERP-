<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrGovernmentConnector; use App\Models\HrGovernmentTransaction;
class GovernmentIntegrationController extends Controller {public function index(){return response()->json(['connectors'=>HrGovernmentConnector::withCount('transactions')->get(),'recent_transactions'=>HrGovernmentTransaction::with('connector')->latest()->limit(15)->get()]);}}