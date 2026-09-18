<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller; use App\Models\FixedAsset; use Illuminate\Http\Request;
class FixedAssetController extends Controller {
 public function index(Request $r){$q=FixedAsset::query();if($r->filled('search')){$s=$r->search;$q->where(fn($x)=>$x->where('asset_code','like',"%$s%")->orWhere('name','like',"%$s%"));}return response()->json(['success'=>true,'data'=>$q->latest()->get()]);}
 public function store(Request $r){$d=$r->validate(['asset_code'=>'required|string|max:100|unique:fixed_assets,asset_code','name'=>'required|string|max:255','description'=>'nullable|string','finance_account_id'=>'nullable|integer','accumulated_depreciation_account_id'=>'nullable|integer','depreciation_expense_account_id'=>'nullable|integer','purchase_date'=>'required|date','in_service_date'=>'nullable|date','cost'=>'required|numeric|min:0','salvage_value'=>'nullable|numeric|min:0','useful_life_months'=>'required|integer|min:1','status'=>'nullable|string']);return response()->json(['success'=>true,'data'=>FixedAsset::create($d)],201);}
 public function update(Request $r, FixedAsset $fixedAsset){$d=$r->validate(['name'=>'sometimes|required|string|max:255','description'=>'nullable|string','cost'=>'sometimes|numeric|min:0','salvage_value'=>'nullable|numeric|min:0','useful_life_months'=>'sometimes|integer|min:1','status'=>'nullable|string','disposal_date'=>'nullable|date','disposal_proceeds'=>'nullable|numeric|min:0','disposal_type'=>'nullable|in:sale,write_off','disposal_notes'=>'nullable|string']);$fixedAsset->update($d);return response()->json(['success'=>true,'data'=>$fixedAsset->fresh()]);}
 public function destroy(FixedAsset $fixedAsset){$fixedAsset->delete();return response()->json(['success'=>true]);}
}
