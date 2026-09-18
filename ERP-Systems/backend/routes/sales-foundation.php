<?php

use App\Http\Controllers\Api\BranchController;
use App\Http\Controllers\Api\BranchStockController;
use App\Http\Controllers\Api\CustomerContactController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DepartmentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| MASA ERP - Organization & Customer Foundation
|--------------------------------------------------------------------------
*/

Route::get('/branches', [BranchController::class, 'index']);
Route::post('/branches', [BranchController::class, 'store']);
Route::get('/branches/{branch}', [BranchController::class, 'show']);
Route::put('/branches/{branch}', [BranchController::class, 'update']);

Route::get('/departments', [DepartmentController::class, 'index']);
Route::post('/departments', [DepartmentController::class, 'store']);
Route::put('/departments/{department}', [DepartmentController::class, 'update']);

Route::get('/customers', [CustomerController::class, 'index']);
Route::post('/customers', [CustomerController::class, 'store']);
Route::get('/customers/{customer}', [CustomerController::class, 'show']);
Route::put('/customers/{customer}', [CustomerController::class, 'update']);

Route::get(
    '/customers/{customer}/contacts',
    [CustomerContactController::class, 'index']
);

Route::post(
    '/customers/{customer}/contacts',
    [CustomerContactController::class, 'store']
);

Route::put(
    '/customers/{customer}/contacts/{contact}',
    [CustomerContactController::class, 'update']
);

Route::delete(
    '/customers/{customer}/contacts/{contact}',
    [CustomerContactController::class, 'destroy']
);

Route::get('/branch-stocks', [BranchStockController::class, 'index']);
