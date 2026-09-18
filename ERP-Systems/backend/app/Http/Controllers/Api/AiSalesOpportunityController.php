<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AiSalesOpportunity;
use Illuminate\Http\Request;
class AiSalesOpportunityController extends Controller {
 public function index(Request $request){
  $q=AiSalesOpportunity::with(['company.latestScore','lead']);
  if($request->filled('stage')) $q->where('stage',$request->stage);
  return response()->json($q->latest()->paginate(min((int)$request->input('per_page',25),100)));
 }
 public function store(Request $request){
  $data=$request->validate(['company_id'=>'required|exists:ai_sales_companies,id','lead_id'=>'nullable|exists:ai_sales_leads,id','title'=>'required|string|max:255','stage'=>'nullable|in:new,qualified,proposal,negotiation,won,lost','value'=>'nullable|numeric|min:0','currency'=>'nullable|string|size:3','probability'=>'nullable|integer|min:0|max:100','expected_close_date'=>'nullable|date','matched_items'=>'nullable|array','next_best_action'=>'nullable|string','owner_id'=>'nullable|exists:users,id']);
  return response()->json(AiSalesOpportunity::create($data),201);
 }
 public function show(AiSalesOpportunity $opportunity){return response()->json($opportunity->load(['company.latestScore','company.signals','lead']));}
 public function update(Request $request,AiSalesOpportunity $opportunity){
  $data=$request->validate(['title'=>'sometimes|required|string|max:255','stage'=>'nullable|in:new,qualified,proposal,negotiation,won,lost','value'=>'nullable|numeric|min:0','probability'=>'nullable|integer|min:0|max:100','expected_close_date'=>'nullable|date','matched_items'=>'nullable|array','next_best_action'=>'nullable|string','owner_id'=>'nullable|exists:users,id']);
  $opportunity->update($data); return response()->json($opportunity->fresh(['company.latestScore','lead']));
 }
}