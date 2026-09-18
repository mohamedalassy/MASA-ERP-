<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AiSalesCompany;
use App\Models\AiSalesLead;
use App\Models\AiSalesOpportunity;
use App\Models\AiSalesSignal;
use Illuminate\Support\Facades\DB;

class AiSalesDashboardController extends Controller {
 public function index(){
  $pipeline=(float)AiSalesOpportunity::whereNotIn('stage',['won','lost'])->sum('value');
  $won=AiSalesOpportunity::where('stage','won')->count();
  $closed=$won+AiSalesOpportunity::where('stage','lost')->count();
  return response()->json([
   'kpis'=>[
    'companies'=>AiSalesCompany::count(),
    'leads'=>AiSalesLead::count(),
    'opportunities'=>AiSalesOpportunity::count(),
    'pipeline_value'=>$pipeline,
    'win_rate'=>$closed?round(($won/$closed)*100,1):0,
    'active_signals'=>AiSalesSignal::where(fn($q)=>$q->whereNull('expires_at')->orWhere('expires_at','>',now()))->count(),
   ],
   'pipeline_by_stage'=>AiSalesOpportunity::select('stage',DB::raw('COUNT(*) as count'),DB::raw('SUM(value) as value'))->groupBy('stage')->get(),
   'signals_by_type'=>AiSalesSignal::select('type',DB::raw('COUNT(*) as count'))->groupBy('type')->orderByDesc('count')->limit(10)->get(),
   'top_companies'=>AiSalesCompany::with('latestScore')->get()->sortByDesc(fn($c)=>optional($c->latestScore)->overall_score??0)->take(10)->values(),
   'recent_companies'=>AiSalesCompany::with('latestScore')->latest('discovered_at')->limit(10)->get(),
  ]);
 }
}