<?php
namespace App\Services\AiSales;use App\Models\AiSalesCompany;
class IntentTimelineService{public function timeline(AiSalesCompany $c):array{$items=[];
foreach($c->signals()->get() as $s)$items[]=['type'=>'signal','date'=>$s->detected_at,'title'=>$s->title,'strength'=>$s->strength,'data'=>$s];
foreach($c->opportunities()->get() as $o)$items[]=['type'=>'opportunity','date'=>$o->created_at,'title'=>$o->title,'strength'=>$o->probability,'data'=>$o];
foreach($c->leads()->get() as $l)$items[]=['type'=>'lead','date'=>$l->created_at,'title'=>'Lead created','strength'=>$l->qualification_score??0,'data'=>$l];
usort($items,fn($a,$b)=>strtotime((string)$b['date'])<=>strtotime((string)$a['date']));return $items;}}