<?php

use App\Http\Controllers\Api\BranchPurchaseReceiptController;
use App\Http\Controllers\Api\SalesDeliveryController;
use App\Http\Controllers\Api\SalesInvoiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MASA ERP - Sales Operations & Finance Phase 4
|--------------------------------------------------------------------------
*/

Route::post(
    '/purchase-orders/{purchaseOrder}/receive-branch',
    [BranchPurchaseReceiptController::class, 'receive']
);

Route::prefix('sales')->group(function () {
    Route::get('/deliveries', [SalesDeliveryController::class, 'index']);
    Route::get('/deliveries/{delivery}', [SalesDeliveryController::class, 'show']);

    Route::post(
        '/orders/{salesOrder}/deliveries',
        [SalesDeliveryController::class, 'store']
    );

    Route::get('/invoices', [SalesInvoiceController::class, 'index']);
    Route::get('/invoices/{invoice}', [SalesInvoiceController::class, 'show']);

    Route::post(
        '/orders/{salesOrder}/create-invoice',
        [SalesInvoiceController::class, 'fromSalesOrder']
    );

    Route::post(
        '/invoices/{invoice}/post',
        [SalesInvoiceController::class, 'post']
    );

    Route::post(
        '/invoices/{invoice}/collect',
        [SalesInvoiceController::class, 'collect']
    );
});
