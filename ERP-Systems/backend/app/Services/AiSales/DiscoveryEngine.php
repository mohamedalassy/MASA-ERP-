<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCompany,AiSalesDiscoveryRun};

class DiscoveryEngine {
 public function ingest(array $companies,array $criteria=[]): AiSalesDiscoveryRun {
  $run=AiSalesDiscoveryRun::create(['status'=>'running','criteria'=>$criteria,'started_at'=>now()]);
  $accepted=0; $rejected=0;
  foreach($companies as $item){
   if(empty($item['name'])){$rejected++;continue;}
   AiSalesCompany::updateOrCreate(
    ['name'=>$item['name'],'website'=>$item['website'] ?? null],
    array_merge($item,['status'=>$item['status'] ?? 'discovered','discovered_at'=>$item['discovered_at'] ?? now()])
   );
   $accepted++;
  }
  $run->update(['status'=>'completed','found_count'=>count($companies),'accepted_count'=>$accepted,'rejected_count'=>$rejected,'finished_at'=>now()]);
  return $run->fresh();
 }
}