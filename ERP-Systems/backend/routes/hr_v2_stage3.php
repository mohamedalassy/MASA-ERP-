<?php
use Illuminate\Support\Facades\Route;use App\Http\Controllers\Api\HrV2\PayrollEmployeeSetupController;use App\Http\Controllers\Api\HrPayrollController;use App\Http\Controllers\Api\HrV2\PayrollPreflightController;
Route::prefix('hr/v2/payroll')->name('hr.v2.payroll.')->group(function(){
 Route::get('preflight',PayrollPreflightController::class);
 Route::get('runs',[HrPayrollController::class,'index']);Route::post('runs',[HrPayrollController::class,'store']);Route::get('runs/{payrollRun}',[HrPayrollController::class,'show']);
 Route::post('runs/{payrollRun}/recalculate',[HrPayrollController::class,'recalculate']);Route::post('runs/{payrollRun}/approve',[HrPayrollController::class,'approve']);Route::post('runs/{payrollRun}/post',[HrPayrollController::class,'post']);
 Route::post('runs/{payrollRun}/wps/validate',[HrPayrollController::class,'validateWps']);Route::post('runs/{payrollRun}/wps/generate',[HrPayrollController::class,'generateWps']);Route::get('runs/{payrollRun}/wps/download',[HrPayrollController::class,'downloadWps']);
});
Route::post('hr/v2/payroll/employees', PayrollEmployeeSetupController::class);
