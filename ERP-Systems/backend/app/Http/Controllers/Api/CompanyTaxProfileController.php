<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller; use App\Models\CompanyTaxProfile; use Illuminate\Http\Request;
class CompanyTaxProfileController extends Controller {
 public function index(){return response()->json(['success'=>true,'data'=>CompanyTaxProfile::query()->latest()->get()]);}
 public function show(CompanyTaxProfile $companyTaxProfile){return response()->json(['success'=>true,'data'=>$companyTaxProfile]);}
 public function store(Request $r){$d=$r->only(['legal_name_ar','legal_name_en','vat_number','commercial_register','building_number','street_name','district','city','postal_code','country_code','branch_name','branch_code','is_default','is_active']);$x=CompanyTaxProfile::create($d);return response()->json(['success'=>true,'data'=>$x],201);}
 public function update(Request $r, CompanyTaxProfile $companyTaxProfile){$companyTaxProfile->update($r->only(['legal_name_ar','legal_name_en','vat_number','commercial_register','building_number','street_name','district','city','postal_code','country_code','branch_name','branch_code','is_default','is_active']));return response()->json(['success'=>true,'data'=>$companyTaxProfile->fresh()]);}
}
