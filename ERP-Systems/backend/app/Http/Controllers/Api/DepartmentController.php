<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query()
            ->with([
                'branch:id,code,name,name_en',
                'manager:id,name,email',
            ])
            ->withCount('users')
            ->orderBy('name');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN)
            );
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        $department = Department::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء القسم بنجاح.',
            'data' => $department->fresh(['branch', 'manager']),
        ], 201);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $this->validatePayload($request, $department);

        $department->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث القسم بنجاح.',
            'data' => $department->fresh(['branch', 'manager']),
        ]);
    }

    private function validatePayload(
        Request $request,
        ?Department $department = null
    ): array {
        return $request->validate([
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('departments', 'code')
                    ->where(fn ($query) =>
                        $query->where('branch_id', $request->integer('branch_id'))
                    )
                    ->ignore($department?->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'name_en' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'manager_id' => ['nullable', 'integer', 'exists:users,id'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }
}
