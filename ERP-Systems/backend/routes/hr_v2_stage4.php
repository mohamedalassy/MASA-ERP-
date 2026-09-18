<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\SaudiComplianceV2Controller;
use App\Http\Controllers\Api\HrV2\GovernmentHubV2Controller;
use App\Http\Controllers\Api\HrV2\WpsController;
Route::prefix('hr/v2')->name('hr.v2.')->group(function(){
 Route::get('saudi-compliance/dashboard',[SaudiComplianceV2Controller::class,'dashboard']);
 Route::get('saudi-compliance/records',[SaudiComplianceV2Controller::class,'records']);
 Route::get('government-hub',[GovernmentHubV2Controller::class,'index']);
 Route::get('wps/batches',[WpsController::class,'index']);
 Route::post('wps/generate',[WpsController::class,'generate']);
});