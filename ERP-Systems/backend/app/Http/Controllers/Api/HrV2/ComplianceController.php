<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller; use App\Models\HrComplianceException; use Illuminate\Http\Request;
class ComplianceController extends Controller {public function index(Request $r){$q=HrComplianceException::with(['employee','rule']);if($r->status)$q->where('status',$r->status);return response()->json($q->latest()->paginate($r->integer('per_page',25)));}}