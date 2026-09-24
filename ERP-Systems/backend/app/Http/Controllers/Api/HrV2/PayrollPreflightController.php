<?php
namespace App\Http\Controllers\Api\HrV2;
use App\Http\Controllers\Controller;use App\Services\PayrollFinancePreflightService;
class PayrollPreflightController extends Controller{public function __invoke(PayrollFinancePreflightService $service){return response()->json(['success'=>true,'data'=>$service->check()]);}}