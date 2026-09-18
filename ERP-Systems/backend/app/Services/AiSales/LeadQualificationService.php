<?php
namespace App\Services\AiSales; use App\Models\AiSalesLead;
class LeadQualificationService {
 public function qualify(AiSalesLead $lead):array{
  $company=$lead->company()->with(['latestScore','signals'])->first();
  $score=0;$reasons=[];
  if($company?->latestScore){$score+=(int)round($company->latestScore->overall_score*.60);$reasons[]='Company AI score contributes 60%';}
  if($lead->email||$lead->phone){$score+=15;$reasons[]='Contact channel available';}
  if($lead->contact_name){$score+=10;$reasons[]='Named contact available';}
  if(($company?->signals?->count()??0)>0){$score+=15;$reasons[]='Buying signal detected';}
  $score=max(0,min(100,$score));
  $lead->update(['qualification_score'=>$score,'qualification_reasons'=>$reasons,'last_qualified_at'=>now()]);
  return ['score'=>$score,'reasons'=>$reasons,'lead'=>$lead->fresh()];
 }
}