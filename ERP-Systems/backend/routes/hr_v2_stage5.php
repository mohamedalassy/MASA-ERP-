<?php
use Illuminate\Support\Facades\Route;use App\Http\Controllers\Api\HrV2\RecruitmentController;use App\Http\Controllers\Api\HrV2\LifecycleV2Controller;
Route::prefix('hr/v2')->name('hr.v2.')->group(function(){
 Route::get('recruitment/dashboard',[RecruitmentController::class,'dashboard']);Route::get('recruitment/candidates',[RecruitmentController::class,'candidates']);
 Route::post('recruitment/requisitions',[RecruitmentController::class,'storeRequisition']);Route::post('recruitment/candidates',[RecruitmentController::class,'storeCandidate']);
 Route::post('recruitment/applications',[RecruitmentController::class,'storeApplication']);Route::patch('recruitment/applications/{application}/stage',[RecruitmentController::class,'moveApplication']);
 Route::get('lifecycle',[LifecycleV2Controller::class,'index']);Route::post('lifecycle/events',[LifecycleV2Controller::class,'storeEvent']);
});