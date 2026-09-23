<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiSalesCatalogProfile;
use App\Services\AiSales\CatalogSyncService;
use Illuminate\Http\JsonResponse;

class AiSalesCatalogSyncController extends Controller
{
    public function index(): JsonResponse
    {
        $profiles = AiSalesCatalogProfile::query()
            ->with([
                'product:id,sku,name,category,brand,model,is_active',
            ])
            ->where('is_active', true)
            ->latest()
            ->get();

        return response()->json([
            'data' => $profiles,
            'meta' => [
                'total' => $profiles->count(),

                'product_profiles' => $profiles
                    ->where('type', 'product')
                    ->count(),

                'linked_products' => $profiles
                    ->whereNotNull('product_id')
                    ->count(),
            ],
        ]);
    }

    public function sync(
        CatalogSyncService $service
    ): JsonResponse {
        $result = $service->syncProducts();

        return response()->json([
            'success' => true,

            'message' =>
                'ERP catalog synchronized with AI Sales successfully.',

            'data' => $result,
        ]);
    }
}