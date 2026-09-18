<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\PeopleCommandCenterController;
use App\Http\Controllers\Api\HrV2\OrganizationController;
use App\Http\Controllers\Api\HrV2\Employee360Controller;
use App\Http\Controllers\Api\HrV2\ComplianceController;
use App\Http\Controllers\Api\HrV2\GovernmentIntegrationController;
Route::prefix('hr/v2')->name('hr.v2.')->group(function(){
 Route::get('command-center',[PeopleCommandCenterController::class,'index']);
 Route::get('organization',[OrganizationController::class,'index']);
 Route::get('employees/{hrEmployee}/360',[Employee360Controller::class,'show']);
 Route::get('compliance/exceptions',[ComplianceController::class,'index']);
 Route::get('government',[GovernmentIntegrationController::class,'index']);
});