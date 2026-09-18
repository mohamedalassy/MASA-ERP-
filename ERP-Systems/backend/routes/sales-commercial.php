<?php

use App\Http\Controllers\Api\SalesContractController;
use App\Http\Controllers\Api\SalesNegotiationController;
use App\Http\Controllers\Api\SalesOrderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MASA ERP - Sales Commercial Phase 3
|--------------------------------------------------------------------------
*/

Route::prefix('sales')->group(function () {
    Route::get('/negotiations', [SalesNegotiationController::class, 'index']);
    Route::post('/negotiations', [SalesNegotiationController::class, 'store']);
    Route::put('/negotiations/{negotiation}', [SalesNegotiationController::class, 'update']);
    Route::post('/negotiations/{negotiation}/approve', [SalesNegotiationController::class, 'approve']);

    Route::get('/orders', [SalesOrderController::class, 'index']);
    Route::get('/orders/{salesOrder}', [SalesOrderController::class, 'show']);

    Route::post(
        '/quotations/{quotation}/create-order',
        [SalesOrderController::class, 'fromQuotation']
    );

    Route::post(
        '/orders/{salesOrder}/confirm',
        [SalesOrderController::class, 'confirm']
    );

    Route::post(
        '/orders/{salesOrder}/cancel',
        [SalesOrderController::class, 'cancel']
    );

    Route::post(
        '/orders/{salesOrder}/create-purchase-order',
        [SalesOrderController::class, 'createPurchaseOrder']
    );

    Route::get('/contracts', [SalesContractController::class, 'index']);
    Route::post('/contracts', [SalesContractController::class, 'store']);
    Route::get('/contracts/{contract}', [SalesContractController::class, 'show']);

    Route::post(
        '/orders/{salesOrder}/create-contract',
        [SalesContractController::class, 'fromSalesOrder']
    );

    Route::post(
        '/contracts/{contract}/approve',
        [SalesContractController::class, 'approve']
    );
});
