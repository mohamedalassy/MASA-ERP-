<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesAiDraft,AiSalesCompany};
class MessageComposerService {
 public function compose(AiSalesCompany $company,array $options=[]):AiSalesAiDraft{
  $company->load(['latestScore','signals']);
  $channel=$options['channel']??'email'; $tone=$options['tone']??'professional'; $purpose=$options['purpose']??'introduction';
  $signal=$company->signals->sortByDesc('strength')->first();
  $subject=$options['subject']??('Business introduction — '.$company->name);
  $body="Hello,\n\nWe would like to introduce our company and explore whether our products or services may support your current business requirements.";
  if($signal){$body.="\n\nWe noticed a recent business development that may make this a relevant time to connect.";}
  $body.="\n\nIf useful, we would be happy to arrange a short discussion to understand your requirements.\n\nBest regards";
  return AiSalesAiDraft::create(['company_id'=>$company->id,'channel'=>$channel,'purpose'=>$purpose,'tone'=>$tone,'subject'=>$subject,'body'=>$body,'context'=>['signal_id'=>$signal?->id,'score'=>$company->latestScore?->overall_score],'status'=>'draft']);
 }
}