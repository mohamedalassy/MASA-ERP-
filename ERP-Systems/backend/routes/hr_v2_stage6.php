<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\HrV2\TalentManagementController;
Route::prefix('hr/v2/talent')->name('hr.v2.talent.')->group(function(){
 Route::get('performance',[TalentManagementController::class,'performance']);
 Route::get('learning',[TalentManagementController::class,'learning']);
 Route::get('succession',[TalentManagementController::class,'succession']);
});