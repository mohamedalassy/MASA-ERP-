<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCatalogProfile,Product};

class CatalogIntelligenceService {
 public function syncProducts(): array {
  $created=0; $updated=0;
  Product::where('is_active',true)->chunkById(100,function($products) use (&$created,&$updated){
   foreach($products as $p){
    $profile=AiSalesCatalogProfile::firstOrNew(['product_id'=>$p->id,'type'=>'product']);
    $wasNew=!$profile->exists;
    $profile->fill([
     'name'=>$p->name,
     'description'=>$p->description,
     'keywords'=>array_values(array_filter([$p->name,$p->category,$p->brand,$p->model])),
     'is_active'=>true,
    ])->save();
    $wasNew ? $created++ : $updated++;
   }
  });
  return compact('created','updated');
 }
 public function activeProfiles(){ return AiSalesCatalogProfile::where('is_active',true)->get(); }
}