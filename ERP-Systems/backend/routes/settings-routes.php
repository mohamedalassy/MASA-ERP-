<?php

/*
|--------------------------------------------------------------------------
| الصلاحيات وسجل التدقيق
|--------------------------------------------------------------------------
|
| ضمّه في routes/api.php:
|     require __DIR__ . '/settings-routes.php';
|
| ⚠ المسارات دي **لازم** تكون محمية — هي اللي بتدير الصلاحيات نفسها.
|
*/

use AppHttpControllersApiAuditLogController;
use AppHttpControllersApiPermissionController;
use IlluminateSupportFacadesRoute;

/* صلاحياتي — متاح لأي مستخدم مسجّل */
Route::middleware('auth:sanctum')->group(function () {
    Route::get('me/permissions', [PermissionController::class, 'me']);
});

/* إدارة الصلاحيات — محمية بصلاحية permissions.manage */
Route::middleware(['auth:sanctum', 'permission:permissions.manage'])
    ->prefix('settings')
    ->group(function () {

        Route::get('permissions', [PermissionController::class, 'catalog']);

        Route::get('departments', [PermissionController::class, 'departments']);

        Route::put(
            'departments/{department}/permissions',
            [PermissionController::class, 'updateDepartmentPermissions']
        );

        Route::get(
            'users/{user}/permissions',
            [PermissionController::class, 'userPermissions']
        );

        Route::put(
            'users/{user}/permissions',
            [PermissionController::class, 'updateUserPermissions']
        );
    });

/* سجل التدقيق — محمي بصلاحية audit.view */
Route::middleware(['auth:sanctum', 'permission:audit.view'])
    ->prefix('settings/audit-logs')
    ->group(function () {
        Route::get('summary', [AuditLogController::class, 'summary']);
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('{auditLog}', [AuditLogController::class, 'show']);
    });
