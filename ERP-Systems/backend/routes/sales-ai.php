<?php

use App\Http\Controllers\Api\SalesAiController;
use App\Http\Controllers\Api\SalesExecutiveCommandController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MASA ERP - Sales AI Phase 6
|--------------------------------------------------------------------------
*/

Route::prefix('sales/ai')->group(function () {
    Route::get('/insights', [SalesAiController::class, 'insights']);

    Route::post(
        '/insights/{insight}/resolve',
        [SalesAiController::class, 'resolveInsight']
    );

    Route::post(
        '/opportunities/{opportunity}/score',
        [SalesAiController::class, 'scoreOpportunity']
    );

    Route::post(
        '/opportunities/score-all',
        [SalesAiController::class, 'scoreAll']
    );

    Route::get(
        '/opportunities/{opportunity}/score-history',
        [SalesAiController::class, 'scoreHistory']
    );

    Route::post(
        '/opportunities/{opportunity}/next-best-action',
        [SalesAiController::class, 'nextBestAction']
    );

    Route::get('/actions', [SalesAiController::class, 'actions']);

    Route::post(
        '/actions/{action}/complete',
        [SalesAiController::class, 'completeAction']
    );

    Route::post(
        '/customers/{customer}/cross-sell',
        [SalesAiController::class, 'generateCrossSell']
    );

    Route::get(
        '/recommendations',
        [SalesAiController::class, 'recommendations']
    );

    Route::post(
        '/recommendations/{recommendation}/accept',
        [SalesAiController::class, 'acceptRecommendation']
    );

    Route::post(
        '/recommendations/{recommendation}/reject',
        [SalesAiController::class, 'rejectRecommendation']
    );

    Route::get(
        '/command-center',
        [SalesExecutiveCommandController::class, 'summary']
    );
});
