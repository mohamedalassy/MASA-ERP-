<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AiSalesCompany;
use Illuminate\Http\Request;
class AiSalesScoreController extends Controller {
 public function store(Request $request,AiSalesCompany $company){
  $data=$request->validate(['fit_score'=>'required|integer|min:0|max:100','intent_score'=>'required|integer|min:0|max:100','timing_score'=>'required|integer|min:0|max:100','confidence_score'=>'required|integer|min:0|max:100','service_matches'=>'nullable|array','reasons'=>'nullable|array','model_version'=>'nullable|string|max:100']);
  $data['overall_score']=(int)round($data['fit_score']*.35+$data['intent_score']*.30+$data['timing_score']*.20+$data['confidence_score']*.15);
  $data['scored_at']=now();
  return response()->json($company->scores()->create($data),201);
 }
}