<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AiSalesIcpProfile,AiSalesMarketMatch,AiSalesBuyingCommittee,AiSalesRelationship,AiSalesCompetitor,AiSalesWatchlist,AiSalesCompany};
use App\Services\AiSales\{ProductMarketMatchingService,IntentTimelineService};
use Illuminate\Http\Request;
class AiSalesExpansionOneController extends Controller{
 public function icps(){return response()->json(AiSalesIcpProfile::latest()->get());}
 public function storeIcp(Request $r){$d=$r->validate(['name'=>'required|string|max:255','description'=>'nullable|string','industries'=>'nullable|array','regions'=>'nullable|array','company_sizes'=>'nullable|array','keywords'=>'nullable|array','positive_signals'=>'nullable|array','negative_signals'=>'nullable|array','catalog_profile_ids'=>'nullable|array','minimum_score'=>'nullable|integer|min:0|max:100','is_active'=>'nullable|boolean']);return response()->json(AiSalesIcpProfile::create($d),201);}
 public function match(AiSalesCompany $company,ProductMarketMatchingService $s){return response()->json($s->match($company));}
 public function matches(AiSalesCompany $company){return response()->json(AiSalesMarketMatch::with('catalogProfile')->where('company_id',$company->id)->orderByDesc('match_score')->get());}
 public function timeline(AiSalesCompany $company,IntentTimelineService $s){return response()->json($s->timeline($company));}
 public function committee(AiSalesCompany $company){return response()->json(AiSalesBuyingCommittee::with('contact')->where('company_id',$company->id)->orderByDesc('influence_score')->get());}
 public function storeCommittee(Request $r,AiSalesCompany $company){$d=$r->validate(['contact_id'=>'required|exists:ai_sales_contacts,id','role'=>'required|in:decision_maker,influencer,technical,finance,procurement,user,champion,blocker,other','influence_score'=>'nullable|integer|min:0|max:100','sentiment'=>'nullable|in:positive,neutral,negative,unknown','interests'=>'nullable|array','notes'=>'nullable|string']);$d['company_id']=$company->id;return response()->json(AiSalesBuyingCommittee::updateOrCreate(['company_id'=>$company->id,'contact_id'=>$d['contact_id']],$d),201);}
 public function graph(AiSalesCompany $company){$rels=AiSalesRelationship::where(fn($q)=>$q->where([['from_type','company'],['from_id',$company->id]])->orWhere([['to_type','company'],['to_id',$company->id]]))->get();return response()->json(['company'=>$company,'relationships'=>$rels]);}
 public function competitors(){return response()->json(AiSalesCompetitor::latest()->get());}
 public function storeCompetitor(Request $r){$d=$r->validate(['name'=>'required|string|max:255','website'=>'nullable|string|max:2048','industry'=>'nullable|string|max:255','strengths'=>'nullable|array','weaknesses'=>'nullable|array','products'=>'nullable|array','notes'=>'nullable|string']);return response()->json(AiSalesCompetitor::create($d),201);}
 public function watchlists(){return response()->json(AiSalesWatchlist::latest()->get());}
 public function storeWatchlist(Request $r){$d=$r->validate(['name'=>'required|string|max:255','type'=>'nullable|string|max:80','criteria'=>'nullable|array','company_ids'=>'nullable|array','signal_types'=>'nullable|array','frequency'=>'nullable|in:hourly,daily,weekly','notify'=>'nullable|boolean','is_active'=>'nullable|boolean']);return response()->json(AiSalesWatchlist::create($d),201);}
}