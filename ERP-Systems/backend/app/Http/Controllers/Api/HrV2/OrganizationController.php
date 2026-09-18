<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrLegalEntity; use App\Models\HrGrade; use App\Models\HrPosition;
class OrganizationController extends Controller {
 public function index(){return response()->json(['legal_entities'=>HrLegalEntity::withCount('branches')->get(),'grades'=>HrGrade::orderBy('level')->get(),'positions'=>HrPosition::with(['department:id,name','grade:id,code,name'])->withCount('employees')->get()]);}
}