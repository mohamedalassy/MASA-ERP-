<?php
namespace App\Services\AiSales;
use App\Models\AiSalesIntegrationSource;
class IntegrationRegistry {
 public function register(array $data):AiSalesIntegrationSource{return AiSalesIntegrationSource::updateOrCreate(['name'=>$data['name']],$data);}
 public function active(){return AiSalesIntegrationSource::where('is_active',true)->get();}
 public function health():array{return AiSalesIntegrationSource::all()->map(fn($s)=>['id'=>$s->id,'name'=>$s->name,'driver'=>$s->driver,'status'=>$s->status,'active'=>$s->is_active,'last_sync_at'=>$s->last_sync_at,'last_error'=>$s->last_error])->all();}
}