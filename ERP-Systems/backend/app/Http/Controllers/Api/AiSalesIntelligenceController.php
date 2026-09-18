<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AiSalesCompany,AiSalesCatalogProfile,AiSalesDiscoveryRun};
use App\Services\AiSales\{CatalogIntelligenceService,CompanyEnrichmentService,DiscoveryEngine,ScoringEngine};
use Illuminate\Http\Request;

class AiSalesIntelligenceController extends Controller {
 public function syncCatalog(CatalogIntelligenceService $svc){ return response()->json(['success'=>true,'result'=>$svc->syncProducts()]); }
 public function catalogProfiles(){ return response()->json(AiSalesCatalogProfile::with('product')->where('is_active',true)->get()); }

 public function storeCatalogProfile(Request $r){
  $d=$r->validate(['name'=>'required|string|max:255','type'=>'required|in:product,service,subscription,project,solution','product_id'=>'nullable|exists:products,id','description'=>'nullable|string','target_industries'=>'nullable|array','target_company_sizes'=>'nullable|array','keywords'=>'nullable|array','buying_signals'=>'nullable|array','pain_points'=>'nullable|array','is_active'=>'nullable|boolean']);
  return response()->json(AiSalesCatalogProfile::create($d),201);
 }

 public function discoveryRuns(){ return response()->json(AiSalesDiscoveryRun::latest()->paginate(25)); }
 public function ingest(Request $r,DiscoveryEngine $engine){
  $d=$r->validate(['companies'=>'required|array|min:1|max:500','companies.*.name'=>'required|string|max:255','companies.*.website'=>'nullable|string|max:255','companies.*.industry'=>'nullable|string|max:255','companies.*.country'=>'nullable|string|max:120','companies.*.region'=>'nullable|string|max:120','companies.*.city'=>'nullable|string|max:120','companies.*.company_size'=>'nullable|string|max:100','companies.*.source'=>'nullable|string|max:120','companies.*.source_url'=>'nullable|string|max:2048','companies.*.data_confidence'=>'nullable|integer|min:0|max:100','criteria'=>'nullable|array']);
  return response()->json($engine->ingest($d['companies'],$d['criteria']??[]),201);
 }

 public function enrich(Request $r,AiSalesCompany $company,CompanyEnrichmentService $svc){
  $d=$r->validate(['industry'=>'nullable|string|max:255','website'=>'nullable|string|max:255','country'=>'nullable|string|max:120','region'=>'nullable|string|max:120','city'=>'nullable|string|max:120','company_size'=>'nullable|string|max:100','data_confidence'=>'nullable|integer|min:0|max:100','enrichment'=>'nullable|array']);
  return response()->json($svc->merge($company,$d));
 }

 public function score(AiSalesCompany $company,ScoringEngine $engine){
  $s=$engine->score($company);
  $record=$company->scores()->create(['fit_score'=>$s['fit'],'intent_score'=>$s['intent'],'timing_score'=>$s['timing'],'confidence_score'=>$s['confidence'],'overall_score'=>$s['overall'],'reasons'=>$s['reasons'],'model_version'=>'rules-v1','scored_at'=>now()]);
  return response()->json($record,201);
 }

 public function scoreAll(ScoringEngine $engine){
  $count=0;
  AiSalesCompany::chunkById(100,function($companies)use($engine,&$count){
   foreach($companies as $company){$s=$engine->score($company);$company->scores()->create(['fit_score'=>$s['fit'],'intent_score'=>$s['intent'],'timing_score'=>$s['timing'],'confidence_score'=>$s['confidence'],'overall_score'=>$s['overall'],'reasons'=>$s['reasons'],'model_version'=>'rules-v1','scored_at'=>now()]);$count++;}
  });
  return response()->json(['success'=>true,'scored'=>$count]);
 }
}