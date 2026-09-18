<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\PayrollV2Controller;
Route::prefix('hr/v2/payroll')->name('hr.v2.payroll.')->group(function(){
 Route::get('runs',[PayrollV2Controller::class,'index']);
 Route::post('runs',[PayrollV2Controller::class,'store']);
 Route::get('runs/{payrollRun}',[PayrollV2Controller::class,'show']);
 Route::post('runs/{payrollRun}/calculate',[PayrollV2Controller::class,'calculate']);
 Route::post('runs/{payrollRun}/approve',[PayrollV2Controller::class,'approve']);
});