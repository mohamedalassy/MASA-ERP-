<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AiSalesTerritory,AiSalesActivity,AiSalesAiDraft,AiSalesCompany,AiSalesLead,AiSalesOpportunity,AiSalesSignal};
use App\Services\AiSales\{MessageComposerService,CommandCenterService};
use Illuminate\Http\Request; use Illuminate\Support\Facades\DB;
class AiSalesAdvancedController extends Controller {
 public function territories(){return response()->json(AiSalesTerritory::where('is_active',true)->get());}
 public function storeTerritory(Request $r){$d=$r->validate(['name'=>'required|string|max:255','country'=>'nullable|string|max:120','region'=>'nullable|string|max:120','cities'=>'nullable|array','industries'=>'nullable|array','owner_id'=>'nullable|exists:users,id','target_value'=>'nullable|numeric|min:0','is_active'=>'nullable|boolean']);return response()->json(AiSalesTerritory::create($d),201);}
 public function activities(Request $r){$q=AiSalesActivity::query();if($r->filled('company_id'))$q->where('company_id',$r->company_id);return response()->json($q->latest()->paginate(50));}
 public function compose(Request $r,AiSalesCompany $company,MessageComposerService $s){$d=$r->validate(['channel'=>'nullable|in:email,whatsapp,sms,other','purpose'=>'nullable|string|max:100','tone'=>'nullable|in:professional,concise,consultative,friendly','subject'=>'nullable|string|max:255']);return response()->json($s->compose($company,$d),201);}
 public function drafts(){return response()->json(AiSalesAiDraft::with('company')->latest()->paginate(25));}
 public function approveDraft(AiSalesAiDraft $draft){$draft->update(['status'=>'approved','approved_at'=>now(),'approved_by'=>auth()->id()]);return response()->json($draft);}
 public function command(Request $r,CommandCenterService $s){$d=$r->validate(['command'=>'required|string|max:1000']);return response()->json($s->execute($d['command']));}
 public function analytics(){
  return response()->json([
   'funnel'=>['companies'=>AiSalesCompany::count(),'leads'=>AiSalesLead::count(),'opportunities'=>AiSalesOpportunity::count(),'won'=>AiSalesOpportunity::where('stage','won')->count()],
   'pipeline_by_stage'=>AiSalesOpportunity::select('stage',DB::raw('COUNT(*) count'),DB::raw('SUM(value) value'))->groupBy('stage')->get(),
   'companies_by_region'=>AiSalesCompany::select('region',DB::raw('COUNT(*) count'))->whereNotNull('region')->groupBy('region')->orderByDesc('count')->get(),
   'signals_by_type'=>AiSalesSignal::select('type',DB::raw('COUNT(*) count'))->groupBy('type')->orderByDesc('count')->get(),
   'monthly_discovery'=>AiSalesCompany::selectRaw("DATE_FORMAT(discovered_at,'%Y-%m') month, COUNT(*) count")->whereNotNull('discovered_at')->groupBy('month')->orderBy('month')->get(),
  ]);
 }
}