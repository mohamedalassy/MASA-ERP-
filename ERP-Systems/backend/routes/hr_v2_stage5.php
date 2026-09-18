<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\RecruitmentController;
use App\Http\Controllers\Api\HrV2\LifecycleV2Controller;
Route::prefix('hr/v2')->name('hr.v2.')->group(function(){
 Route::get('recruitment/dashboard',[RecruitmentController::class,'dashboard']);
 Route::get('recruitment/candidates',[RecruitmentController::class,'candidates']);
 Route::get('lifecycle',[LifecycleV2Controller::class,'index']);
});