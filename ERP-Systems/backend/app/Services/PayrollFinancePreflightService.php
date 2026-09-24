<?php
namespace App\Services;
use App\Models\FinanceAccount;use App\Models\GosiRateSchedule;
class PayrollFinancePreflightService{
 private const ACCOUNTS=['5210'=>'Salary expense','5230'=>'GOSI employer expense','5240'=>'EOSB expense','2130'=>'Salary payable','2150'=>'GOSI payable','2220'=>'EOSB provision'];
 public function check():array{
  $accounts=[];$ok=true;
  foreach(self::ACCOUNTS as $code=>$label){$a=FinanceAccount::where('code',$code)->first();$valid=$a&&$a->is_active&&$a->is_postable;$accounts[]=['code'=>$code,'label'=>$label,'exists'=>(bool)$a,'active'=>(bool)($a?->is_active),'postable'=>(bool)($a?->is_postable),'valid'=>(bool)$valid];if(!$valid)$ok=false;}
  $today=now()->toDateString();$rates=[];
  foreach(['existing','new','expat'] as $scheme){$r=GosiRateSchedule::where('scheme',$scheme)->where('effective_from','<=',$today)->where(fn($q)=>$q->whereNull('effective_to')->orWhere('effective_to','>=',$today))->latest('effective_from')->first();$rates[$scheme]=$r?['effective_from'=>$r->effective_from,'effective_to'=>$r->effective_to,'pension_employee'=>(float)$r->pension_employee,'pension_employer'=>(float)$r->pension_employer,'hazards_employer'=>(float)$r->hazards_employer,'saned_employee'=>(float)$r->saned_employee,'saned_employer'=>(float)$r->saned_employer,'wage_ceiling'=>(float)$r->wage_ceiling]:null;if(!$r)$ok=false;}
  return ['ready'=>$ok,'accounts'=>$accounts,'gosi_rates'=>$rates,'checked_at'=>now()];
 }
}