<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * فحص الصلاحية على المسار.
 *
 * التسجيل في bootstrap/app.php:
 *
 *     ->withMiddleware(function (Middleware $middleware) {
 *         $middleware->alias([
 *             'permission' => \App\Http\Middleware\CheckPermission::class,
 *         ]);
 *     })
 *
 * الاستخدام:
 *     Route::post('...')->middleware('permission:finance.journal.post');
 *
 * وبحد مبلغ من حقل في الطلب:
 *     ->middleware('permission:purchasing.order.approve,total')
 */
class CheckPermission
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission,
        ?string $amountField = null
    ): Response {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول.',
            ], 401);
        }

        if (!($user->is_active ?? true)) {
            return response()->json([
                'success' => false,
                'message' => 'الحساب موقوف.',
            ], 403);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'success' => false,
                'message' => 'لا تملك صلاحية تنفيذ هذه العملية.',
                'required_permission' => $permission,
            ], 403);
        }

        // فحص حد المبلغ لو المسار بيمرّر حقلًا
        if ($amountField) {
            $amount = (float) $request->input($amountField, 0);

            if ($amount > 0 && !$user->canWithAmount($permission, $amount)) {
                $limit = $user->permissionLimit($permission);

                return response()->json([
                    'success' => false,
                    'message' => sprintf(
                        'المبلغ %s يتجاوز حدك المسموح %s — العملية تحتاج اعتمادًا أعلى.',
                        number_format($amount, 2),
                        number_format((float) $limit, 2)
                    ),
                    'required_permission' => $permission,
                    'amount_limit' => $limit,
                ], 403);
            }
        }

        return $next($request);
    }
}
