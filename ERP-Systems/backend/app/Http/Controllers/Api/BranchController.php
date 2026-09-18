<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query()
            ->withCount(['users', 'departments', 'customers', 'projects'])
            ->with('manager:id,name,email')
            ->orderByDesc('is_head_office')
            ->orderBy('name');

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)
            );
        }

        if ($request->filled('search')) {
            $search = trim($request->string('search')->toString());

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('name_en', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function show(Branch $branch)
    {
        $branch->load([
            'manager:id,name,email',
            'departments.manager:id,name,email',
        ]);

        return response()->json([
            'success' => true,
            'data' => $branch,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $branch = Branch::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الفرع بنجاح.',
            'data' => $branch->fresh(),
        ], 201);
    }

    public function update(Request $request, Branch $branch)
    {
        $validated = $this->validatePayload($request, $branch);

        $branch->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الفرع بنجاح.',
            'data' => $branch->fresh(),
        ]);
    }

    private function validatePayload(Request $request, ?Branch $branch = null): array
    {
        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('branches', 'code')->ignore($branch?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'is_head_office' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}
