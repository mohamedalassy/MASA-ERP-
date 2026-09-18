<?php
namespace App\Services\AiSales; use App\Models\AiSalesCompany;
class DuplicateDetectionService {
 public function find(AiSalesCompany $company):array{
  $q=AiSalesCompany::where('id','!=',$company->id);
  $matches=$q->where(function($x)use($company){
   if($company->dedupe_key)$x->orWhere('dedupe_key',$company->dedupe_key);
   if($company->website)$x->orWhere('website',$company->website);
   $x->orWhere('name',$company->name);
  })->limit(20)->get();
  return $matches->map(fn($m)=>['id'=>$m->id,'name'=>$m->name,'website'=>$m->website,'reason'=>$m->dedupe_key===$company->dedupe_key?'dedupe_key':'name_or_website'])->all();
 }
}