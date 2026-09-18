<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'supplier_code',
                'name',
                'contact_person',
                'phone',
                'email',
                'payment_terms',
                'credit_days',
            ]);

        return response()->json([
            'success' => true,
            'count' => $suppliers->count(),
            'data' => $suppliers,
        ]);
    }
}