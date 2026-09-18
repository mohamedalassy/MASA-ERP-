<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AiSalesCompany;
use App\Models\AiSalesLead;
use Illuminate\Http\Request;
class AiSalesLeadController extends Controller {
 public function index(Request $request){return response()->json(AiSalesLead::with(['company.latestScore'])->latest()->paginate(min((int)$request->input('per_page',25),100)));}
 public function store(Request $request,AiSalesCompany $company){
  $data=$request->validate(['status'=>'nullable|in:new,qualified,contacted,nurturing,converted,lost','priority'=>'nullable|in:low,medium,high,urgent','contact_name'=>'nullable|string|max:255','contact_title'=>'nullable|string|max:255','email'=>'nullable|email|max:255','phone'=>'nullable|string|max:50','notes'=>'nullable|string','owner_id'=>'nullable|exists:users,id']);
  $company->update(['status'=>'approved']); return response()->json($company->leads()->create($data),201);
 }
 public function show(AiSalesLead $lead){return response()->json($lead->load(['company.latestScore','company.signals','opportunities']));}
}