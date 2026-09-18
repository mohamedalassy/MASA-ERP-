<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\AttendanceCommandCenterController;
use App\Http\Controllers\Api\HrV2\RosterController;
use App\Http\Controllers\Api\HrV2\AttendanceRequestController;
Route::prefix('hr/v2')->name('hr.v2.')->group(function(){
 Route::get('attendance/command-center',[AttendanceCommandCenterController::class,'index']);
 Route::get('rosters',[RosterController::class,'index']);
 Route::post('rosters',[RosterController::class,'store']);
 Route::get('attendance/corrections',[AttendanceRequestController::class,'corrections']);
 Route::get('attendance/overtime',[AttendanceRequestController::class,'overtime']);
 Route::get('leaves',[AttendanceRequestController::class,'leaves']);
});