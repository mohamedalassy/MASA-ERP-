<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCompany,AiSalesCatalogProfile,AiSalesMarketMatch,AiSalesIcpProfile};
class ProductMarketMatchingService{
 public function match(AiSalesCompany $company):array{
  $profiles=AiSalesCatalogProfile::where('is_active',true)->get();$out=[];
  foreach($profiles as $p){$score=20;$reasons=[];$gaps=[];
   $industries=array_map('mb_strtolower',$p->target_industries??[]);
   if($company->industry && in_array(mb_strtolower($company->industry),$industries)){$score+=35;$reasons[]='Industry matches target profile';}elseif($industries){$gaps[]='Industry is outside configured target list';}
   $signals=$company->signals()->pluck('type')->map(fn($x)=>mb_strtolower($x))->all();
   $buy=array_map('mb_strtolower',$p->buying_signals??[]);$hits=count(array_intersect($signals,$buy));if($hits){$score+=min(30,$hits*10);$reasons[]="$hits relevant buying signal(s)";}
   if($company->latestScore?->overall_score>=70){$score+=15;$reasons[]='Strong company AI score';}
   $score=min(100,$score);$m=AiSalesMarketMatch::updateOrCreate(['company_id'=>$company->id,'catalog_profile_id'=>$p->id],['match_score'=>$score,'confidence'=>min(95,50+count($reasons)*15),'reasons'=>$reasons,'gaps'=>$gaps,'matched_at'=>now()]);$out[]=$m;
  } return $out;
 }
}