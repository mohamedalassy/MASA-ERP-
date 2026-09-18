<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerContact;
use Illuminate\Http\Request;

class CustomerContactController extends Controller
{
    public function index(Customer $customer)
    {
        return response()->json([
            'success' => true,
            'data' => $customer->contacts()
                ->orderByDesc('is_primary')
                ->orderByDesc('is_decision_maker')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, Customer $customer)
    {
        $validated = $this->validatePayload($request);

        if (!empty($validated['is_primary'])) {
            $customer->contacts()->update(['is_primary' => false]);
        }

        $contact = $customer->contacts()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة جهة الاتصال بنجاح.',
            'data' => $contact,
        ], 201);
    }

    public function update(
        Request $request,
        Customer $customer,
        CustomerContact $contact
    ) {
        abort_unless(
            (int) $contact->customer_id === (int) $customer->id,
            404
        );

        $validated = $this->validatePayload($request);

        if (!empty($validated['is_primary'])) {
            $customer->contacts()
                ->whereKeyNot($contact->id)
                ->update(['is_primary' => false]);
        }

        $contact->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث جهة الاتصال بنجاح.',
            'data' => $contact->fresh(),
        ]);
    }

    public function destroy(Customer $customer, CustomerContact $contact)
    {
        abort_unless(
            (int) $contact->customer_id === (int) $customer->id,
            404
        );

        $contact->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف جهة الاتصال.',
        ]);
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:100'],
            'mobile' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'role' => ['nullable', 'string', 'max:100'],
            'influence_level' => ['nullable', 'in:low,medium,high'],
            'is_primary' => ['nullable', 'boolean'],
            'is_decision_maker' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);
    }
}
