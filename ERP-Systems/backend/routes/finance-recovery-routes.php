<?php
// RECOVERY PATCH: merge these imports/routes into routes/api.php after review.
use App\Http\Controllers\Api\FixedAssetController;
use App\Http\Controllers\Api\CompanyTaxProfileController;
use App\Http\Controllers\Api\CustomerTaxProfileController;

Route::prefix('finance')->group(function () {
    Route::get('/fixed-assets', [FixedAssetController::class, 'index']);
    Route::post('/fixed-assets', [FixedAssetController::class, 'store']);
    Route::put('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'update']);
    Route::delete('/fixed-assets/{fixedAsset}', [FixedAssetController::class, 'destroy']);

    Route::get('/tax-profiles', [CompanyTaxProfileController::class, 'index']);
    Route::post('/tax-profiles', [CompanyTaxProfileController::class, 'store']);
    Route::get('/tax-profiles/{companyTaxProfile}', [CompanyTaxProfileController::class, 'show']);
    Route::put('/tax-profiles/{companyTaxProfile}', [CompanyTaxProfileController::class, 'update']);

    Route::get('/customer-tax-profiles', [CustomerTaxProfileController::class, 'index']);
    Route::post('/customer-tax-profiles', [CustomerTaxProfileController::class, 'store']);
    Route::get('/customer-tax-profiles/{customerTaxProfile}', [CustomerTaxProfileController::class, 'show']);
    Route::put('/customer-tax-profiles/{customerTaxProfile}', [CustomerTaxProfileController::class, 'update']);
});
