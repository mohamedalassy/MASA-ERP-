<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query()
            ->with([
                'branch:id,code,name,name_en',
                'owner:id,name,email',
                'contacts',
            ])
            ->withCount('projects')
            ->latest('id');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('owner_id')) {
            $query->where('owner_id', $request->integer('owner_id'));
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('commercial_register', 'like', "%{$search}%")
                    ->orWhere('tax_number', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'count' => $query->count(),
            'data' => $query->limit(200)->get(),
        ]);
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'branch:id,code,name,name_en',
            'owner:id,name,email',
            'creator:id,name,email',
            'contacts',
            'projects:id,customer_id,branch_id,project_code,name,current_stage,status,total_value',
        ]);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        if (empty($validated['code'])) {
            $validated['code'] = 'CUS-' . now()->format('ymdHis');
        }

        $validated['created_by'] = $request->user()?->id;

        $customer = Customer::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء العميل بنجاح.',
            'data' => $customer->fresh(['branch', 'owner']),
        ], 201);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $this->validatePayload($request, $customer);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث العميل بنجاح.',
            'data' => $customer->fresh(['branch', 'owner', 'contacts']),
        ]);
    }

    private function validatePayload(Request $request, ?Customer $customer = null): array
    {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'code')->ignore($customer?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'in:company,individual,government'],
            'industry' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'commercial_register' => ['nullable', 'string', 'max:255'],
            'tax_number' => ['nullable', 'string', 'max:255'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'payment_terms_days' => ['nullable', 'integer', 'min:0', 'max:3650'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'country' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:active,inactive,blocked'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
