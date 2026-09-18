<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductAlternative;
use App\Models\SupplierPrice;
use Illuminate\Http\Request;

class ProductAlternativeController extends Controller
{
    public function index(Request $request)
    {
        $query = ProductAlternative::query()
            ->with([
                'product',
                'alternativeProduct',
                'creator:id,name',
            ])
            ->orderByDesc('is_preferred')
            ->orderBy('priority')
            ->orderByDesc('id');

        if ($request->filled('product_id')) {
            $query->where(
                'product_id',
                $request->integer('product_id')
            );
        }

        if ($request->filled('alternative_product_id')) {
            $query->where(
                'alternative_product_id',
                $request->integer('alternative_product_id')
            );
        }

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var(
                    $request->is_active,
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        $rows = $query->get()->map(
            fn ($row) => $this->transformRow($row)
        );

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function productAlternatives(Product $product)
    {
        $rows = ProductAlternative::query()
            ->with([
                'product',
                'alternativeProduct',
            ])
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->orderByDesc('is_preferred')
            ->orderBy('priority')
            ->orderByDesc('id')
            ->get()
            ->map(fn ($row) => $this->transformRow($row));

        return response()->json([
            'success' => true,
            'product' => $product,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        if (
            (int) $validated['product_id'] ===
            (int) $validated['alternative_product_id']
        ) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن إضافة نفس المنتج كبديل لنفسه.',
            ], 422);
        }

        $exists = ProductAlternative::query()
            ->where('product_id', $validated['product_id'])
            ->where(
                'alternative_product_id',
                $validated['alternative_product_id']
            )
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'هذا البديل مضاف بالفعل لهذا المنتج.',
            ], 422);
        }

        if (!empty($validated['is_preferred'])) {
            ProductAlternative::query()
                ->where('product_id', $validated['product_id'])
                ->update(['is_preferred' => false]);
        }

        $row = ProductAlternative::create([
            ...$validated,
            'created_by' => $request->user()?->id,
        ]);

        $row->load([
            'product',
            'alternativeProduct',
            'creator:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة البديل بنجاح.',
            'data' => $this->transformRow($row),
        ], 201);
    }

    public function update(
        Request $request,
        ProductAlternative $productAlternative
    ) {
        $validated = $request->validate([
            'priority' => ['nullable', 'integer', 'min:1', 'max:999999'],
            'is_preferred' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        if (!empty($validated['is_preferred'])) {
            ProductAlternative::query()
                ->where('product_id', $productAlternative->product_id)
                ->whereKeyNot($productAlternative->id)
                ->update(['is_preferred' => false]);
        }

        $productAlternative->update($validated);

        $productAlternative->load([
            'product',
            'alternativeProduct',
            'creator:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث البديل بنجاح.',
            'data' => $this->transformRow($productAlternative),
        ]);
    }

    public function destroy(ProductAlternative $productAlternative)
    {
        $productAlternative->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف البديل.',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
            'alternative_product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],
            'priority' => [
                'nullable',
                'integer',
                'min:1',
                'max:999999',
            ],
            'is_preferred' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'reason' => ['nullable', 'string', 'max:1000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);
    }

    private function transformRow(ProductAlternative $row): array
    {
        $alternative = $row->alternativeProduct;

        $supplierPrices = SupplierPrice::query()
            ->with('supplier')
            ->where('product_id', $row->alternative_product_id)
            ->where('is_active', true)
            ->orderByDesc('is_preferred')
            ->orderBy('unit_price')
            ->get();

        $validSupplierPrices = $supplierPrices
            ->filter(function ($price) {
                return !$price->valid_until ||
                    $price->valid_until->endOfDay()->isFuture();
            })
            ->values();

        $bestSupplierPrice = $validSupplierPrices
            ->sortBy('unit_price')
            ->first();

        $fastestSupplierPrice = $validSupplierPrices
            ->filter(
                fn ($price) => $price->lead_time_days !== null
            )
            ->sortBy('lead_time_days')
            ->first();

        $salePrice = (float) (
            $alternative?->default_sale_price ?? 0
        );

        $fallbackCost = (float) (
            $alternative?->cost_price ?? 0
        );

        $bestCost = $bestSupplierPrice
            ? (float) $bestSupplierPrice->unit_price
            : $fallbackCost;

        $margin = $salePrice > 0
            ? (($salePrice - $bestCost) / $salePrice) * 100
            : null;

        return [
            ...$row->toArray(),

            'comparison' => [
                'cost_price' => round($fallbackCost, 2),
                'default_sale_price' => round($salePrice, 2),
                'best_cost' => round($bestCost, 2),
                'margin_percent' => $margin === null
                    ? null
                    : round($margin, 2),

                'stock_quantity' => (float) (
                    $alternative?->stock_quantity ?? 0
                ),

                'best_supplier_price' => $bestSupplierPrice
                    ? [
                        ...$bestSupplierPrice->toArray(),
                        'supplier' => $bestSupplierPrice->supplier,
                    ]
                    : null,

                'fastest_supplier_price' => $fastestSupplierPrice
                    ? [
                        ...$fastestSupplierPrice->toArray(),
                        'supplier' => $fastestSupplierPrice->supplier,
                    ]
                    : null,
            ],
        ];
    }
}
