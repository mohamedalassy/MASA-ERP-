<?php
namespace App\Services\AiSales;
use App\Models\{AiSalesCompany,AiSalesImportBatch}; use Illuminate\Http\UploadedFile;
class CsvImportService {
 public function import(UploadedFile $file):AiSalesImportBatch{
  $batch=AiSalesImportBatch::create(['source'=>'csv','filename'=>$file->getClientOriginalName(),'status'=>'running','started_at'=>now()]);
  $h=fopen($file->getRealPath(),'r');$header=fgetcsv($h)?:[];$header=array_map(fn($v)=>strtolower(trim($v)),$header);
  $total=$created=$updated=$skipped=0;$errors=[];
  while(($row=fgetcsv($h))!==false){$total++;try{
   $data=array_combine($header,array_pad($row,count($header),null));
   if(empty($data['name'])){$skipped++;continue;}
   $model=AiSalesCompany::firstOrNew(['name'=>$data['name'],'website'=>$data['website']??null]);$new=!$model->exists;
   $model->fill(array_filter(['industry'=>$data['industry']??null,'country'=>$data['country']??null,'region'=>$data['region']??null,'city'=>$data['city']??null,'company_size'=>$data['company_size']??null,'source'=>'csv'],fn($v)=>$v!==null))->save();
   $new?$created++:$updated++;
  }catch(\Throwable $e){$skipped++;if(count($errors)<50)$errors[]=['row'=>$total+1,'error'=>$e->getMessage()];}}
  fclose($h);$batch->update(['status'=>'completed','total_rows'=>$total,'created_rows'=>$created,'updated_rows'=>$updated,'skipped_rows'=>$skipped,'errors'=>$errors,'finished_at'=>now()]);return $batch->fresh();
 }
}