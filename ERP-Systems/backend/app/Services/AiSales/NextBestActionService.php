<?php
namespace App\Services\AiSales; use App\Models\{AiSalesCompany,AiSalesRecommendation};
class NextBestActionService {
 public function generate(AiSalesCompany $company):AiSalesRecommendation{
  $company->load(['latestScore','signals','leads','opportunities']);
  $score=$company->latestScore?->overall_score??0;
  $signal=$company->signals->sortByDesc('strength')->first();
  if(!$company->leads->count() && $score>=70){$title='Review and approve as lead';$action='Open Company 360, verify contact data, then approve the account as a lead.';$priority=$score;}
  elseif($signal && $signal->strength>=70){$title='Act on strong buying signal';$action='Review the detected signal and prepare a relevant, human-approved outreach or sales task.';$priority=max($score,$signal->strength);}
  elseif($company->opportunities->count()){$title='Advance active opportunity';$action='Review opportunity health, risks and the next pending sales step.';$priority=max(55,$score);}
  else{$title='Enrich account before outreach';$action='Complete company and decision-maker enrichment before creating outreach.';$priority=max(40,$score);}
  return AiSalesRecommendation::create(['company_id'=>$company->id,'type'=>'next_best_action','title'=>$title,'reason'=>$signal?->title ?? 'Based on account readiness and AI score','recommended_action'=>$action,'priority_score'=>min(100,$priority),'confidence'=>$company->latestScore?->confidence_score??50,'context'=>['overall_score'=>$score,'signal_id'=>$signal?->id]]);
 }
}