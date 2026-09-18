<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCompany,AiSalesLead,AiSalesOpportunity,AiSalesRecommendation,AiSalesSignal};
class CommandCenterService {
 public function execute(string $command):array{
  $q=mb_strtolower(trim($command));
  if(str_contains($q,'high')||str_contains($q,'top')) return ['intent'=>'top_accounts','data'=>AiSalesCompany::with('latestScore')->get()->sortByDesc(fn($c)=>$c->latestScore?->overall_score??0)->take(20)->values()];
  if(str_contains($q,'signal')) return ['intent'=>'signals','data'=>AiSalesSignal::with('company')->latest('detected_at')->limit(30)->get()];
  if(str_contains($q,'opportun')) return ['intent'=>'opportunities','data'=>AiSalesOpportunity::with('company')->latest()->limit(30)->get()];
  if(str_contains($q,'lead')) return ['intent'=>'leads','data'=>AiSalesLead::with('company')->latest()->limit(30)->get()];
  return ['intent'=>'summary','data'=>['companies'=>AiSalesCompany::count(),'leads'=>AiSalesLead::count(),'opportunities'=>AiSalesOpportunity::count(),'open_recommendations'=>AiSalesRecommendation::where('status','open')->count()]];
 }
}