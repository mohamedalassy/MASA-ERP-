<?php
namespace App\Services\AiSales;use App\Models\{AiSalesLead,User};
class LeadRoutingService{public function route(AiSalesLead $lead):AiSalesLead{$user=User::query()->select('users.*')->selectSub(function($q){$q->from('ai_sales_leads')->selectRaw('COUNT(*)')->whereColumn('owner_id','users.id')->whereNotIn('status',['won','lost']);},'ai_sales_load')->orderBy('ai_sales_load')->first();if($user)$lead->update(['owner_id'=>$user->id,'routing_reason'=>'Least-loaded available sales owner']);return $lead->fresh();}}
