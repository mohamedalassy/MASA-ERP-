<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\AiSalesCompany;
use Illuminate\Http\Request;

class AiSalesCompanyController extends Controller {
 public function index(Request $request){
  $q=AiSalesCompany::query()->with('latestScore');
  if($request->filled('search')) $q->where(fn($x)=>$x->where('name','like','%'.$request->search.'%')->orWhere('industry','like','%'.$request->search.'%')->orWhere('city','like','%'.$request->search.'%'));
  if($request->filled('status')) $q->where('status',$request->status);
  if($request->filled('region')) $q->where('region',$request->region);
  return response()->json($q->latest('discovered_at')->paginate(min((int)$request->input('per_page',25),100)));
 }
 public function show(AiSalesCompany $company){
  return response()->json($company->load(['signals'=>fn($q)=>$q->latest('detected_at'),'latestScore','leads','opportunities']));
 }
 public function store(Request $request){
  $data=$request->validate(['name'=>'required|string|max:255','legal_name'=>'nullable|string|max:255','industry'=>'nullable|string|max:255','website'=>'nullable|string|max:255','country'=>'nullable|string|max:120','region'=>'nullable|string|max:120','city'=>'nullable|string|max:120','company_size'=>'nullable|string|max:100','source'=>'nullable|string|max:120','source_url'=>'nullable|string|max:2048','status'=>'nullable|in:discovered,reviewing,approved,rejected,watching','data_confidence'=>'nullable|integer|min:0|max:100','enrichment'=>'nullable|array']);
  $data['discovered_at']=$data['discovered_at']??now();
  return response()->json(AiSalesCompany::create($data),201);
 }
 public function update(Request $request,AiSalesCompany $company){
  $data=$request->validate(['name'=>'sometimes|required|string|max:255','industry'=>'nullable|string|max:255','website'=>'nullable|string|max:255','region'=>'nullable|string|max:120','city'=>'nullable|string|max:120','status'=>'nullable|in:discovered,reviewing,approved,rejected,watching','data_confidence'=>'nullable|integer|min:0|max:100','enrichment'=>'nullable|array']);
  $company->update($data); return response()->json($company->fresh('latestScore'));
 }
}