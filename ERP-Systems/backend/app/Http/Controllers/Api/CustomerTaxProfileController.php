<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller; use App\Models\CustomerTaxProfile; use Illuminate\Http\Request;
class CustomerTaxProfileController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>CustomerTaxProfile::query()->latest()->get()]);}
 public function show(CustomerTaxProfile $customerTaxProfile){return response()->json(['success'=>true,'data'=>$customerTaxProfile]);}
 public function store(Request $r){$d=$r->only(['customer_id','customer_code','legal_name_ar','legal_name_en','is_vat_registered','vat_number','commercial_register','building_number','street_name','district','city','postal_code','country_code','is_active']);$x=CustomerTaxProfile::create($d);return response()->json(['success'=>true,'data'=>$x],201);}
 public function update(Request $r, CustomerTaxProfile $customerTaxProfile){$customerTaxProfile->update($r->only(['customer_id','customer_code','legal_name_ar','legal_name_en','is_vat_registered','vat_number','commercial_register','building_number','street_name','district','city','postal_code','country_code','is_active']));return response()->json(['success'=>true,'data'=>$customerTaxProfile->fresh()]);}
}
