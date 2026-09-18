<?php
use App\Http\Controllers\Api\SupplierPriceHistoryController;
use App\Http\Controllers\Api\PricingRuleController;
use App\Http\Controllers\Api\PricingPackageController;
use App\Http\Controllers\Api\ProductAlternativeController;
use App\Http\Controllers\Api\PricingCostingController;

// Add with the other imports in routes/api.php
use App\Http\Controllers\Api\ProjectQuotationController;

// أضف هذا الـ import أعلى routes/api.php:
use App\Http\Controllers\Api\SupplierPriceController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProjectExpenseController;
use App\Http\Controllers\Api\InventoryTransactionController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\PurchaseOrderItemController;
use App\Http\Controllers\Api\SupplierController;
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'MASA ERP API is working',
    ]);
});

Route::get(
    '/projects',
    [ProjectController::class, 'index']
);

Route::get(
    '/projects/{project}',
    [ProjectController::class, 'show']
);

Route::post(
    '/projects/{project}/next-stage',
    [ProjectController::class, 'moveToNextStage']
);

Route::post(
    '/projects/{project}/previous-stage',
    [ProjectController::class, 'moveToPreviousStage']
);

Route::get(
    '/projects/{project}/purchase-orders',
    [PurchaseOrderController::class, 'index']
);

Route::post(
    '/projects/{project}/purchase-orders',
    [PurchaseOrderController::class, 'store']
);

Route::get('/purchase-test', function () {
    return response()->json([
        'success' => true,
        'message' => 'purchase routes loaded',
    ]);
});

Route::get(
    '/purchase-orders/{purchaseOrder}',
    [PurchaseOrderController::class, 'show']
);

Route::put(
    '/purchase-orders/{purchaseOrder}',
    [PurchaseOrderController::class, 'update']
);

Route::post(
    '/purchase-orders/{purchaseOrder}/submit-for-approval',
    [PurchaseOrderController::class, 'submitForApproval']
);

Route::post(
    '/purchase-orders/{purchaseOrder}/approve',
    [PurchaseOrderController::class, 'approve']
);

Route::post(
    '/purchase-orders/{purchaseOrder}/cancel',
    [PurchaseOrderController::class, 'cancel']
);

Route::post(
    '/purchase-orders/{purchaseOrder}/receive',
    [PurchaseOrderController::class, 'receive']
);

Route::post(
    '/purchase-orders/{purchaseOrder}/items',
    [PurchaseOrderItemController::class, 'store']
);

Route::put(
    '/purchase-orders/{purchaseOrder}/items/{item}',
    [PurchaseOrderItemController::class, 'update']
);

Route::delete(
    '/purchase-orders/{purchaseOrder}/items/{item}',
    [PurchaseOrderItemController::class, 'destroy']
);

Route::get(
    '/products',
    [ProductController::class, 'index']
);

Route::get(
    '/suppliers',
    [SupplierController::class, 'index']
);

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

Route::get(
    '/inventory-transactions',
    [InventoryTransactionController::class, 'index']
);

Route::get(
    '/products/{product}/inventory-transactions',
    [InventoryTransactionController::class, 'productHistory']
);
Route::post(
    '/inventory/issue-to-project',
    [InventoryTransactionController::class, 'issueToProject']
);

Route::get(
    '/projects/{project}/expenses',
    [ProjectExpenseController::class, 'index']
);

Route::post(
    '/projects/{project}/expenses',
    [ProjectExpenseController::class, 'store']
);

Route::delete(
    '/projects/{project}/expenses/{expense}',
    [ProjectExpenseController::class, 'destroy']
);
Route::put(
    '/projects/{project}/execution-status',
    [ProjectController::class, 'updateExecutionStatus']
);

Route::post(
    '/projects/{project}/hold-execution',
    [ProjectController::class, 'holdExecution']
);

Route::post(
    '/projects/{project}/resume-execution',
    [ProjectController::class, 'resumeExecution']
);

Route::post(
    '/projects/{project}/return-to-stage',
    [ProjectController::class, 'returnToStage']
);
Route::get(
    '/projects/{project}/quotations',
    [ProjectQuotationController::class, 'index']
);

Route::get(
    '/projects/{project}/quotations/{quotation}',
    [ProjectQuotationController::class, 'show']
);

Route::post(
    '/projects/{project}/quotations/{quotation}/revision',
    [ProjectQuotationController::class, 'createRevision']
);

Route::post(
    '/projects/{project}/quotations/{quotation}/approve',
    [ProjectQuotationController::class, 'approve']
);
Route::post(
    '/projects/{project}/quotations',
    [ProjectQuotationController::class, 'store']
);
Route::put(
    '/projects/{project}/quotations/{quotation}',
    [ProjectQuotationController::class, 'update']
);
Route::get(
    '/quotations',
    [ProjectQuotationController::class, 'all']
);
Route::get('/products', [ProductController::class, 'index']);
Route::post('/products', [ProductController::class, 'store']);
Route::put('/products/{product}', [ProductController::class, 'update']);

// أضف هذا المسار بجوار مسارات ProjectQuotationController الحالية:

Route::post(
    '/projects/{project}/quotations/{quotation}/submit-for-approval',
    [ProjectQuotationController::class, 'submitForApproval']
);
// أضف المسارين دول بجوار مسارات عروض الأسعار:

Route::post(
    '/projects/{project}/quotations/{quotation}/submit-for-approval',
    [ProjectQuotationController::class, 'submitForApproval']
);

Route::post(
    '/projects/{project}/quotations/{quotation}/request-changes',
    [ProjectQuotationController::class, 'requestChanges']
);



// ثم أضف هذه الـ routes:
Route::get('/supplier-prices', [SupplierPriceController::class, 'index']);
Route::get('/products/{product}/supplier-prices', [SupplierPriceController::class, 'productPrices']);
Route::post('/supplier-prices', [SupplierPriceController::class, 'store']);
Route::put('/supplier-prices/{supplierPrice}', [SupplierPriceController::class, 'update']);



Route::get(
    '/supplier-price-history',
    [SupplierPriceHistoryController::class, 'index']
);

Route::get('/pricing-rules', [PricingRuleController::class, 'index']);
Route::post('/pricing-rules', [PricingRuleController::class, 'store']);
Route::put('/pricing-rules/{pricingRule}', [PricingRuleController::class, 'update']);
Route::delete('/pricing-rules/{pricingRule}', [PricingRuleController::class, 'destroy']);
Route::post('/pricing-rules/resolve', [PricingRuleController::class, 'resolve']);


Route::get('/pricing-packages', [PricingPackageController::class, 'index']);
Route::get('/pricing-packages/{pricingPackage}', [PricingPackageController::class, 'show']);
Route::post('/pricing-packages', [PricingPackageController::class, 'store']);
Route::put('/pricing-packages/{pricingPackage}', [PricingPackageController::class, 'update']);
Route::delete('/pricing-packages/{pricingPackage}', [PricingPackageController::class, 'destroy']);


Route::get('/product-alternatives', [ProductAlternativeController::class, 'index']);
Route::get('/products/{product}/alternatives', [ProductAlternativeController::class, 'productAlternatives']);
Route::post('/product-alternatives', [ProductAlternativeController::class, 'store']);
Route::put('/product-alternatives/{productAlternative}', [ProductAlternativeController::class, 'update']);
Route::delete('/product-alternatives/{productAlternative}', [ProductAlternativeController::class, 'destroy']);



Route::get('/pricing-costings', [PricingCostingController::class, 'index']);
Route::post('/pricing-costings/calculate', [PricingCostingController::class, 'calculate']);
Route::get('/pricing-costings/{pricingCosting}', [PricingCostingController::class, 'show']);
Route::post('/pricing-costings', [PricingCostingController::class, 'store']);
Route::put('/pricing-costings/{pricingCosting}', [PricingCostingController::class, 'update']);
Route::delete('/pricing-costings/{pricingCosting}', [PricingCostingController::class, 'destroy']);



// Keep your existing quotation routes. Add only this new route:
Route::post('/projects/{project}/quotations/{quotation}/reject', [ProjectQuotationController::class, 'reject']);
