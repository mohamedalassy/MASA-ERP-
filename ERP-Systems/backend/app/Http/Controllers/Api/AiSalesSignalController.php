<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AiSalesCompany;
use Illuminate\Http\Request;
class AiSalesSignalController extends Controller {
 public function store(Request $request,AiSalesCompany $company){
  $data=$request->validate(['type'=>'required|string|max:100','title'=>'required|string|max:255','description'=>'nullable|string','strength'=>'nullable|integer|min:0|max:100','confidence'=>'nullable|integer|min:0|max:100','source'=>'nullable|string|max:120','source_url'=>'nullable|string|max:2048','evidence'=>'nullable|array','detected_at'=>'nullable|date','expires_at'=>'nullable|date']);
  $data['detected_at']=$data['detected_at']??now();
  return response()->json($company->signals()->create($data),201);
 }
}