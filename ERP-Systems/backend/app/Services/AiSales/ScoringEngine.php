<?php
namespace App\Services\AiSales;
use App\Models\AiSalesCompany;

class ScoringEngine {
 public function score(AiSalesCompany $company): array {
  $signals=$company->signals()->get();
  $signalStrength=(int)round($signals->avg('strength') ?? 0);
  $signalConfidence=(int)round($signals->avg('confidence') ?? 0);
  $enrichment=$company->enrichment ?? [];

  $fit=$this->clamp(
   25 +
   ($company->industry ? 15 : 0) +
   ($company->website ? 10 : 0) +
   ($company->city ? 10 : 0) +
   min(40, count($enrichment)*5)
  );
  $intent=$this->clamp($signalStrength);
  $timing=$this->clamp($signals->whereIn('type',['expansion','new_branch','funding','tender','hiring','procurement'])->max('strength') ?? 20);
  $confidence=$this->clamp((int)round(($company->data_confidence + $signalConfidence)/2));
  $overall=(int)round($fit*.35+$intent*.30+$timing*.20+$confidence*.15);

  $reasons=[];
  if($signals->count()) $reasons[]=$signals->count().' active buying signal(s) detected';
  if($company->industry) $reasons[]='Industry profile is available';
  if($company->website) $reasons[]='Company website is available for enrichment';
  if($timing>=70) $reasons[]='Strong timing signal detected';

  return compact('fit','intent','timing','confidence','overall','reasons');
 }
 private function clamp($v){return max(0,min(100,(int)$v));}
}