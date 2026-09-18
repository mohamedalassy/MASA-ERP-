<?php
namespace App\Services\AiSales; use App\Models\{AiSalesOpportunity,AiSalesCatalogProfile};
class OpportunityIntelligenceService {
 public function analyze(AiSalesOpportunity $op):array{
  $op->load(['company.latestScore','company.signals','lead']);
  $score=35;$risks=[];$recommended=[];
  if($op->company?->latestScore){$score+=(int)round($op->company->latestScore->overall_score*.30);}
  if($op->lead?->qualification_score>=70)$score+=15; else $risks[]='Lead qualification is below high-confidence threshold';
  if((float)$op->value>0)$score+=5; else $risks[]='Opportunity value is not defined';
  if($op->expected_close_date)$score+=5; else $risks[]='Expected close date is missing';
  if(in_array($op->stage,['proposal','negotiation']))$score+=10;
  $score=max(0,min(100,$score));
  $risk=$score>=75?'low':($score>=50?'medium':'high');
  $recommended=AiSalesCatalogProfile::where('is_active',true)->limit(5)->get(['id','name','type','product_id'])->toArray();
  $op->update(['health_score'=>$score,'risk_level'=>$risk,'risk_reasons'=>$risks,'recommended_items'=>$recommended,'last_analyzed_at'=>now()]);
  return ['health_score'=>$score,'risk_level'=>$risk,'risk_reasons'=>$risks,'recommended_items'=>$recommended,'opportunity'=>$op->fresh()];
 }
}