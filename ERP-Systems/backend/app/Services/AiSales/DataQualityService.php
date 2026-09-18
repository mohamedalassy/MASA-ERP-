<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCompany,AiSalesContact};
class DataQualityService {
 public function company(AiSalesCompany $c):array{
  $issues=[];$score=100;
  foreach(['name'=>25,'website'=>15,'industry'=>15,'country'=>10,'region'=>10,'city'=>10] as $field=>$penalty){if(blank($c->{$field})){$issues[]="Missing {$field}";$score-=$penalty;}}
  if(($c->data_confidence??0)<50){$issues[]='Low source confidence';$score-=15;}
  $score=max(0,$score);$key=$this->key($c->name,$c->website);
  $c->update(['quality_score'=>$score,'quality_issues'=>$issues,'dedupe_key'=>$key]);
  return ['quality_score'=>$score,'issues'=>$issues,'dedupe_key'=>$key];
 }
 public function contact(AiSalesContact $c):array{
  $issues=[];$score=100;
  if(blank($c->name)){$issues[]='Missing name';$score-=35;}
  if(blank($c->email)&&blank($c->phone)){$issues[]='No contact channel';$score-=40;}
  if(blank($c->job_title)){$issues[]='Missing job title';$score-=15;}
  if(($c->confidence??0)<50){$issues[]='Low confidence';$score-=10;}
  $score=max(0,$score);$c->update(['quality_score'=>$score,'quality_issues'=>$issues]);
  return ['quality_score'=>$score,'issues'=>$issues];
 }
 public function key(?string $name,?string $website):string{
  $host=$website?preg_replace('#^https?://(www\.)?#i','',trim($website)):'';
  $host=preg_replace('#/.*$#','',$host);
  return hash('sha256',mb_strtolower(trim((string)$name)).'|'.mb_strtolower((string)$host));
 }
}