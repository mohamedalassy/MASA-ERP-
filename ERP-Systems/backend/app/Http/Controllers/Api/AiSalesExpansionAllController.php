<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AiSalesCompany,AiSalesDealRoom,AiSalesWinLossReview,AiSalesTarget,AiSalesMeeting,AiSalesFeedback,AiSalesGovernanceEvent,AiSalesConsent,AiSalesKnowledgeDocument,AiSalesWebhook};
use App\Services\AiSales\{RevenueIntelligenceService,DailyBriefService,TenderDocumentIntelligenceService};
use Illuminate\Http\Request;
class AiSalesExpansionAllController extends Controller{
 public function revenue(AiSalesCompany $company,RevenueIntelligenceService $s){return response()->json($s->scan($company));}
 public function forecast(RevenueIntelligenceService $s){return response()->json($s->forecast());}
 public function dailyBrief(DailyBriefService $s){return response()->json($s->build());}
 public function dealRoom($opportunity){return response()->json(AiSalesDealRoom::firstOrCreate(['opportunity_id'=>$opportunity]));}
 public function winLoss(Request $r,$opportunity){$d=$r->validate(['outcome'=>'required|in:won,lost,no_decision','reasons'=>'nullable|array','competitors'=>'nullable|array','lessons'=>'nullable|string']);$d['opportunity_id']=$opportunity;return response()->json(AiSalesWinLossReview::updateOrCreate(['opportunity_id'=>$opportunity],$d));}
 public function targets(){return response()->json(AiSalesTarget::latest()->get());}
 public function storeTarget(Request $r){$d=$r->validate(['scope_type'=>'required|string','scope_id'=>'nullable|integer','metric'=>'required|string','target_value'=>'required|numeric','period_start'=>'required|date','period_end'=>'required|date|after_or_equal:period_start']);return response()->json(AiSalesTarget::create($d),201);}
 public function meetings(){return response()->json(AiSalesMeeting::latest('meeting_at')->paginate(25));}
 public function storeMeeting(Request $r){$d=$r->validate(['company_id'=>'nullable|exists:ai_sales_companies,id','opportunity_id'=>'nullable|exists:ai_sales_opportunities,id','title'=>'required|string','meeting_at'=>'nullable|date','notes'=>'nullable|string','summary'=>'nullable|string','commitments'=>'nullable|array','objections'=>'nullable|array','next_actions'=>'nullable|array']);return response()->json(AiSalesMeeting::create($d),201);}
 public function feedback(Request $r){$d=$r->validate(['subject_type'=>'required|string','subject_id'=>'required|integer','rating'=>'required|in:useful,not_useful','comment'=>'nullable|string']);return response()->json(AiSalesFeedback::create($d),201);}
 public function governance(){return response()->json(AiSalesGovernanceEvent::latest()->paginate(50));}
 public function consent(Request $r){$d=$r->validate(['company_id'=>'nullable|exists:ai_sales_companies,id','contact_id'=>'nullable|exists:ai_sales_contacts,id','channel'=>'required|string','status'=>'required|in:allowed,opted_out,suppressed','reason'=>'nullable|string']);$d['changed_at']=now();return response()->json(AiSalesConsent::create($d),201);}
 public function knowledge(){return response()->json(AiSalesKnowledgeDocument::where('is_active',true)->latest()->paginate(25));}
 public function storeKnowledge(Request $r){$d=$r->validate(['title'=>'required|string','source_type'=>'nullable|string','source_ref'=>'nullable|string','content'=>'nullable|string','metadata'=>'nullable|array','is_active'=>'nullable|boolean']);return response()->json(AiSalesKnowledgeDocument::create($d),201);}
 public function webhooks(){return response()->json(AiSalesWebhook::latest()->get());}
 public function storeWebhook(Request $r){$d=$r->validate(['name'=>'required|string','url'=>'required|url','events'=>'nullable|array','secret'=>'nullable|string','is_active'=>'nullable|boolean']);return response()->json(AiSalesWebhook::create($d),201);}
 public function tenderAnalyze(Request $r,TenderDocumentIntelligenceService $s){$d=$r->validate(['text'=>'required|string|max:200000']);return response()->json($s->analyze($d['text']));}
}