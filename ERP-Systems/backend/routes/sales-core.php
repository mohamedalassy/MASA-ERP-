<?php

use App\Http\Controllers\Api\SalesActivityController;
use App\Http\Controllers\Api\SalesLeadController;
use App\Http\Controllers\Api\SalesOpportunityController;
use App\Http\Controllers\Api\SalesPipelineController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MASA ERP - Sales Core Phase 2
|--------------------------------------------------------------------------
*/

Route::prefix('sales')->group(function () {
    Route::get('/pipeline/summary', [SalesPipelineController::class, 'summary']);

    Route::get('/leads', [SalesLeadController::class, 'index']);
    Route::post('/leads', [SalesLeadController::class, 'store']);
    Route::get('/leads/{lead}', [SalesLeadController::class, 'show']);
    Route::put('/leads/{lead}', [SalesLeadController::class, 'update']);

    Route::post(
        '/leads/{lead}/convert',
        [SalesLeadController::class, 'convert']
    );

    Route::post(
        '/leads/{lead}/disqualify',
        [SalesLeadController::class, 'disqualify']
    );

    Route::get('/opportunities', [SalesOpportunityController::class, 'index']);
    Route::post('/opportunities', [SalesOpportunityController::class, 'store']);
    Route::get('/opportunities/{opportunity}', [SalesOpportunityController::class, 'show']);
    Route::put('/opportunities/{opportunity}', [SalesOpportunityController::class, 'update']);

    Route::post(
        '/opportunities/{opportunity}/stage',
        [SalesOpportunityController::class, 'moveStage']
    );

    Route::post(
        '/opportunities/{opportunity}/create-project',
        [SalesOpportunityController::class, 'createProject']
    );

    Route::get('/activities', [SalesActivityController::class, 'index']);
    Route::post('/activities', [SalesActivityController::class, 'store']);
    Route::put('/activities/{activity}', [SalesActivityController::class, 'update']);

    Route::post(
        '/activities/{activity}/complete',
        [SalesActivityController::class, 'complete']
    );
});
