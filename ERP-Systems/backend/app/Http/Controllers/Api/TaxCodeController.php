<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxCodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TaxCode::query()
            ->orderBy('code');

        if ($request->filled('active')) {
            $query->where(
                'is_active',
                $request->boolean('active')
            );
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:tax_codes,code',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'rate' => [
                'required',
                'numeric',
                'min:0',
            ],

            'category' => [
                'nullable',
                'string',
                'max:50',
            ],

            'exemption_reason_code' => [
                'nullable',
                'string',
                'max:50',
            ],

            'exemption_reason' => [
                'nullable',
                'string',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $taxCode = TaxCode::create($data);

        return response()->json([
            'message' => 'تم إنشاء الكود الضريبي بنجاح.',
            'data' => $taxCode,
        ], 201);
    }

    public function update(
        Request $request,
        TaxCode $taxCode
    ): JsonResponse {
        $data = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',

                Rule::unique(
                    'tax_codes',
                    'code'
                )->ignore($taxCode->id),
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'rate' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
            ],

            'category' => [
                'nullable',
                'string',
                'max:50',
            ],

            'exemption_reason_code' => [
                'nullable',
                'string',
                'max:50',
            ],

            'exemption_reason' => [
                'nullable',
                'string',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        $taxCode->update($data);

        return response()->json([
            'message' => 'تم تحديث الكود الضريبي بنجاح.',
            'data' => $taxCode->fresh(),
        ]);
    }
}