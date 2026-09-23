<?php

/*
|--------------------------------------------------------------------------
| الصلاحيات وسجل التدقيق
|--------------------------------------------------------------------------
|
| يتم تحميل هذا الملف من routes/api.php:
|
| require __DIR__ . '/settings-routes.php';
|
| هذه المسارات محمية لأنها تدير الصلاحيات وسجل التدقيق.
|
*/

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\PermissionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| My Permissions
|--------------------------------------------------------------------------
|
| متاح لأي مستخدم مسجل.
|
*/

Route::middleware('auth:sanctum')->group(function () {

    Route::get(
        'me/permissions',
        [PermissionController::class, 'me']
    );

});

/*
|--------------------------------------------------------------------------
| Permissions Management
|--------------------------------------------------------------------------
|
| محمية بصلاحية:
| permissions.manage
|
*/

Route::middleware([
    'auth:sanctum',
    'permission:permissions.manage',
])
    ->prefix('settings')
    ->group(function () {

        Route::get(
            'permissions',
            [PermissionController::class, 'catalog']
        );

        Route::get(
            'departments',
            [PermissionController::class, 'departments']
        );

        Route::put(
            'departments/{department}/permissions',
            [
                PermissionController::class,
                'updateDepartmentPermissions',
            ]
        );

        Route::get(
            'users/{user}/permissions',
            [
                PermissionController::class,
                'userPermissions',
            ]
        );

        Route::put(
            'users/{user}/permissions',
            [
                PermissionController::class,
                'updateUserPermissions',
            ]
        );

    });

/*
|--------------------------------------------------------------------------
| Audit Logs
|--------------------------------------------------------------------------
|
| محمية بصلاحية:
| audit.view
|
*/

Route::middleware([
    'auth:sanctum',
    'permission:audit.view',
])
    ->prefix('settings/audit-logs')
    ->group(function () {

        Route::get(
            'summary',
            [AuditLogController::class, 'summary']
        );

        Route::get(
            '/',
            [AuditLogController::class, 'index']
        );

        Route::get(
            '{auditLog}',
            [AuditLogController::class, 'show']
        );

    });