<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BranchProductStock;
use Illuminate\Http\Request;

class BranchStockController extends Controller
{
    public function index(Request $request)
    {
        $query = BranchProductStock::query()
            ->with([
                'branch:id,code,name,name_en',
                'product:id,sku,name,unit,cost_price',
            ])
            ->orderBy('branch_id')
            ->orderBy('product_id');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->integer('product_id'));
        }

        $rows = $query->limit(500)->get();

        $rows->each(function ($row) {
            $row->setAttribute(
                'available_quantity',
                $row->available_quantity
            );
        });

        return response()->json([
            'success' => true,
            'count' => $rows->count(),
            'data' => $rows,
        ]);
    }
}
