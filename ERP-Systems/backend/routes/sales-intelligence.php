<?php

use App\Http\Controllers\Api\CustomerCreditController;
use App\Http\Controllers\Api\SalesCommissionController;
use App\Http\Controllers\Api\SalesIntelligenceController;
use App\Http\Controllers\Api\SalesRenewalController;
use App\Http\Controllers\Api\SalesTargetController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MASA ERP - Revenue Intelligence Phase 5
|--------------------------------------------------------------------------
*/

Route::prefix('sales')->group(function () {
    Route::get('/targets', [SalesTargetController::class, 'index']);
    Route::post('/targets', [SalesTargetController::class, 'store']);
    Route::get('/targets/performance', [SalesTargetController::class, 'performance']);

    Route::get('/commissions', [SalesCommissionController::class, 'index']);
    Route::post('/commissions/generate', [SalesCommissionController::class, 'generate']);
    Route::post('/commissions/{commission}/approve', [SalesCommissionController::class, 'approve']);

    Route::get('/forecast', [SalesIntelligenceController::class, 'forecast']);
    Route::post('/forecast/snapshot', [SalesIntelligenceController::class, 'snapshotForecast']);
    Route::get('/forecast/history', [SalesIntelligenceController::class, 'forecastHistory']);

    Route::get('/deal-health', [SalesIntelligenceController::class, 'dealHealth']);
    Route::post('/deal-health/refresh', [SalesIntelligenceController::class, 'refreshDealHealth']);

    Route::get('/revenue-leakage', [SalesIntelligenceController::class, 'leakage']);
    Route::post('/revenue-leakage/detect', [SalesIntelligenceController::class, 'detectLeakage']);
    Route::post('/revenue-leakage/{leakage}/resolve', [SalesIntelligenceController::class, 'resolveLeakage']);

    Route::get('/profitability/customers', [SalesIntelligenceController::class, 'profitability']);

    Route::get('/credit-control', [CustomerCreditController::class, 'index']);
    Route::post('/credit-control/refresh', [CustomerCreditController::class, 'refresh']);
    Route::put('/credit-control/{profile}', [CustomerCreditController::class, 'update']);

    Route::get('/renewals', [SalesRenewalController::class, 'index']);
    Route::post('/renewals/generate', [SalesRenewalController::class, 'generate']);
    Route::post('/renewals/{renewal}/convert', [SalesRenewalController::class, 'convert']);
});
