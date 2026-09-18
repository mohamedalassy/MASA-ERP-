<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectExpense;
use Illuminate\Http\Request;

class ProjectExpenseController extends Controller
{
    /**
     * عرض مصروفات المشروع
     */
    public function index(Project $project)
    {
        $expenses = ProjectExpense::query()
            ->where('project_id', $project->id)
            ->with('creator:id,name')
            ->latest('id')
            ->get();

        return response()->json([
            'success' => true,

            'summary' => [
                'count' => $expenses->count(),

                'total' => $expenses->sum(
                    fn ($expense) =>
                        (float) $expense->amount
                ),
            ],

            'data' => $expenses,
        ]);
    }

    /**
     * إضافة مصروف جديد للمشروع
     */
    public function store(
        Request $request,
        Project $project
    ) {
        $validated = $request->validate([
            'category' => [
                'nullable',
                'string',
                'max:100',
            ],

            'type' => [
                'nullable',
                'string',
                'max:100',
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'description' => [
                'required',
                'string',
            ],

            'expense_date' => [
                'nullable',
                'date',
            ],

            'reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        $type =
            $validated['category']
            ?? $validated['type']
            ?? 'other';

        $description =
            $validated['description'];

        if (!empty($validated['notes'])) {
            $description .=
                ' - ' . $validated['notes'];
        }

        $expense = ProjectExpense::create([
            'project_id' =>
                $project->id,

            'type' =>
                $type,

            'amount' =>
                $validated['amount'],

            'description' =>
                $description,

            'expense_date' =>
                $validated['expense_date']
                ?? now()->toDateString(),

            'reference' =>
                $validated['reference']
                ?? null,

            'created_by' =>
                auth()->id(),
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم إضافة مصروف المشروع بنجاح.',

            'data' =>
                $expense->load(
                    'creator:id,name'
                ),
        ], 201);
    }

    /**
     * حذف مصروف
     */
    public function destroy(
        Project $project,
        ProjectExpense $expense
    ) {
        if (
            (int) $expense->project_id !==
            (int) $project->id
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'المصروف لا ينتمي لهذا المشروع.',
            ], 422);
        }

        $expense->delete();

        return response()->json([
            'success' => true,

            'message' =>
                'تم حذف مصروف المشروع بنجاح.',
        ]);
    }
}