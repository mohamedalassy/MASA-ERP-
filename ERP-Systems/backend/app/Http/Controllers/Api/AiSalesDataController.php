<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\{AiSalesCompany,AiSalesContact,AiSalesImportBatch,AiSalesIntegrationSource};
use App\Services\AiSales\{CsvImportService,DataQualityService,DuplicateDetectionService,IntegrationRegistry};
use Illuminate\Http\Request;
class AiSalesDataController extends Controller {
 public function qualityCompany(AiSalesCompany $company,DataQualityService $s){return response()->json($s->company($company));}
 public function qualityContact(AiSalesContact $contact,DataQualityService $s){return response()->json($s->contact($contact));}
 public function duplicates(AiSalesCompany $company,DuplicateDetectionService $s){return response()->json($s->find($company));}
 public function importCsv(Request $r,CsvImportService $s){$r->validate(['file'=>'required|file|mimes:csv,txt|max:10240']);return response()->json($s->import($r->file('file')),201);}
 public function importBatches(){return response()->json(AiSalesImportBatch::latest()->paginate(25));}
 public function exportCompanies(){
  $rows=AiSalesCompany::select('name','website','industry','country','region','city','company_size','status','quality_score')->cursor();
  return response()->streamDownload(function()use($rows){$o=fopen('php://output','w');fputcsv($o,['name','website','industry','country','region','city','company_size','status','quality_score']);foreach($rows as $r)fputcsv($o,$r->toArray());fclose($o);},'ai-sales-companies.csv',['Content-Type'=>'text/csv']);
 }
 public function integrations(IntegrationRegistry $r){return response()->json($r->health());}
 public function storeIntegration(Request $r,IntegrationRegistry $registry){
  $d=$r->validate(['name'=>'required|string|max:255','driver'=>'required|string|max:120','status'=>'nullable|string|max:50','config'=>'nullable|array','capabilities'=>'nullable|array','is_active'=>'nullable|boolean']);
  return response()->json($registry->register($d),201);
 }
}