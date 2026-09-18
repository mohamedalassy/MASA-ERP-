<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\EmployeeExperienceController;
use App\Http\Controllers\Api\HrV2\HrHelpdeskController;
Route::prefix('hr/v2')->name('hr.v2.')->group(function(){
 Route::get('employee-portal',[EmployeeExperienceController::class,'portal']);
 Route::post('employee-portal/service-requests',[EmployeeExperienceController::class,'serviceRequest']);
 Route::post('employee-portal/letter-requests',[EmployeeExperienceController::class,'letterRequest']);
 Route::get('helpdesk',[HrHelpdeskController::class,'index']);
 Route::patch('helpdesk/{serviceRequest}',[HrHelpdeskController::class,'update']);
});