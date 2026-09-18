<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AiSalesAutomationRule,AiSalesRecommendation,AiSalesCompany,AiSalesLead,AiSalesOpportunity};
use App\Services\AiSales\{AutomationEngine,LeadQualificationService,NextBestActionService,OpportunityIntelligenceService};
use Illuminate\Http\Request;
class AiSalesAutomationController extends Controller {
 public function rules(){return response()->json(AiSalesAutomationRule::latest()->get());}
 public function storeRule(Request $r){$d=$r->validate(['name'=>'required|string|max:255','trigger'=>'required|string|max:120','conditions'=>'nullable|array','actions'=>'nullable|array','is_active'=>'nullable|boolean']);return response()->json(AiSalesAutomationRule::create($d),201);}
 public function run(Request $r,AutomationEngine $e){$d=$r->validate(['trigger'=>'required|string|max:120','context'=>'nullable|array']);return response()->json($e->run($d['trigger'],$d['context']??[]));}
 public function qualify(AiSalesLead $lead,LeadQualificationService $s){return response()->json($s->qualify($lead));}
 public function analyze(AiSalesOpportunity $opportunity,OpportunityIntelligenceService $s){return response()->json($s->analyze($opportunity));}
 public function nextAction(AiSalesCompany $company,NextBestActionService $s){return response()->json($s->generate($company),201);}
 public function recommendations(){return response()->json(AiSalesRecommendation::with('company')->where('status','open')->orderByDesc('priority_score')->paginate(25));}
 public function updateRecommendation(Request $r,AiSalesRecommendation $recommendation){$d=$r->validate(['status'=>'required|in:open,accepted,dismissed,completed']);$recommendation->update($d);return response()->json($recommendation);}
}