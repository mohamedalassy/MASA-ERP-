<?php

use App\Http\Controllers\Api\SalesSystemHealthController;
use Illuminate\Support\Facades\Route;

Route::get('/sales/system-health', SalesSystemHealthController::class);
