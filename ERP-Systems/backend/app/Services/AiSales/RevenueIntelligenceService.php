<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCompany,AiSalesRevenueOpportunity,AiSalesOpportunity,AiSalesCatalogProfile};
class RevenueIntelligenceService{
 public function scan(AiSalesCompany $c):array{
  $c->load(['opportunities','latestScore']);$out=[];$score=$c->latestScore?->overall_score??40;
  $types=$c->opportunities->where('stage','won')->count()?['upsell','cross_sell','renewal']:['reactivation'];
  foreach($types as $type){$r=AiSalesRevenueOpportunity::firstOrCreate(['company_id'=>$c->id,'type'=>$type,'status'=>'open'],['title'=>ucwords(str_replace('_',' ',$type)).' opportunity','score'=>min(100,$score+10),'recommended_items'=>AiSalesCatalogProfile::where('is_active',true)->limit(5)->pluck('id')->all(),'reasons'=>['Account history and catalog fit']]);$out[]=$r;}return $out;
 }
 public function forecast():array{
  $ops=AiSalesOpportunity::whereNotIn('stage',['won','lost'])->get();$weighted=$ops->sum(fn($o)=>(float)$o->value*((int)$o->probability/100));
  return ['open_pipeline'=>$ops->sum('value'),'weighted_forecast'=>round($weighted,2),'opportunities'=>$ops->count()];
 }}