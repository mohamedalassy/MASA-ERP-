<?php
namespace App\Services\AiSales;
use App\Models\AiSalesCompany;

class CompanyEnrichmentService {
 public function merge(AiSalesCompany $company,array $data): AiSalesCompany {
  $current=$company->enrichment ?? [];
  $company->update([
   'industry'=>$data['industry'] ?? $company->industry,
   'website'=>$data['website'] ?? $company->website,
   'country'=>$data['country'] ?? $company->country,
   'region'=>$data['region'] ?? $company->region,
   'city'=>$data['city'] ?? $company->city,
   'company_size'=>$data['company_size'] ?? $company->company_size,
   'data_confidence'=>$data['data_confidence'] ?? $company->data_confidence,
   'enrichment'=>array_merge($current,$data['enrichment'] ?? []),
   'last_enriched_at'=>now(),
  ]);
  return $company->fresh();
 }
}