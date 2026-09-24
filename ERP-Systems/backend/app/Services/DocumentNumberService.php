<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
class DocumentNumberService {
 public function next(string $type,string $prefix):string {
  return DB::transaction(function()use($type,$prefix){
   $year=now()->format('Y');$latest=null;
   if($type==='payroll_run'){$latest=DB::table('hr_payroll_runs')->where('run_number','like',"{$prefix}-{$year}-%")->lockForUpdate()->orderByDesc('id')->value('run_number');}
   $n=1;if($latest&&preg_match('/(\d+)$/',$latest,$m))$n=((int)$m[1])+1;
   return sprintf('%s-%s-%05d',$prefix,$year,$n);
  });
 }
}
