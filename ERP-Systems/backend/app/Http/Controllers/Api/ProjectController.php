<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectWorkflowHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller
{
    public function show(Project $project)
    {
        $project->load([
            'notes.user',
            'attachments',
            'quotations.items.product',
            'purchaseOrders.items.product',
            'purchaseOrders.supplier',
            'financialTransactions',
            'workflowHistory.transferredBy',
            'workflowHistory.assignedTo',
        ]);

        return response()->json([
            'success' => true,
            'data' => $project,
        ]);
    }

    public function moveToNextStage(
        Request $request,
        Project $project
    ) {
        $user = $request->user();

        if ($user && !$user->canTransferProject()) {
            return response()->json([
                'success' => false,
                'message' => 'ليس لديك صلاحية لنقل المشروع.',
            ], 403);
        }

        /*
         * لا نسمح بخروج المشروع من التسعير
         * قبل اعتماد أحدث عرض سعر.
         */
        if ($project->current_stage === 'pricing') {
            $latestQuotation = $project->quotations()
                ->orderByDesc('version')
                ->orderByDesc('id')
                ->first();

            if (!$latestQuotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'يجب إنشاء عرض سعر واعتماده قبل إرسال المشروع للقسم التالي.',
                ], 422);
            }

            if ($project->quotation_revision_required) {
                return response()->json([
                    'success' => false,
                    'message' => 'يوجد تعديل مطلوب على عرض السعر. أنشئ Revision جديد أولاً.',
                ], 422);
            }

            if ($latestQuotation->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'يجب اعتماد أحدث عرض سعر قبل إرسال المشروع للقسم التالي.',
                ], 422);
            }
        }

        $nextStage = $project->getNextStage();

        if (!$nextStage) {
            return response()->json([
                'success' => false,
                'message' => 'المشروع موجود بالفعل في آخر مرحلة.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'assigned_to' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ]);

        $fromStage = $project->current_stage;

        DB::transaction(function () use (
            $project,
            $nextStage,
            $fromStage,
            $validated,
            $user,
            $request
        ) {
            $updateData = [
                'current_stage' => $nextStage,

                'status' =>
                    $nextStage === 'closed'
                        ? 'completed'
                        : 'active',
            ];

            /*
             * أول ما المشروع يدخل التنفيذ
             * نبدأ بحالة "جاهز للبدء".
             */
            if (
                $nextStage === 'execution' &&
                !$project->execution_status
            ) {
                $updateData['execution_status'] = 'ready';
            }

            $project->update($updateData);

            ProjectWorkflowHistory::create([
                'project_id' => $project->id,

                'from_stage' => $fromStage,

                'to_stage' => $nextStage,

                'status' => 'completed',

                'transferred_by' =>
                    $user?->id,

                'assigned_to' =>
                    $validated['assigned_to']
                    ?? null,

                'notes' =>
                    $validated['notes']
                    ?? null,

                'transferred_at' => now(),
            ]);

            AuditLog::create([
                'user_id' => $user?->id,

                'action' => 'transferred',

                'module' => 'project',

                'record_id' => $project->id,

                'title' =>
                    'تم نقل المشروع إلى قسم جديد',

                'description' =>
                    "تم نقل المشروع من {$fromStage} إلى {$nextStage}",

                'old_values' => [
                    'current_stage' => $fromStage,
                ],

                'new_values' => [
                    'current_stage' => $nextStage,
                ],

                'ip_address' =>
                    $request->ip(),

                'user_agent' =>
                    $request->userAgent(),
            ]);
        });

        $project->refresh();

        return response()->json([
            'success' => true,

            'message' =>
                'تم نقل المشروع بنجاح.',

            'data' => [
                'project_id' =>
                    $project->id,

                'current_stage' =>
                    $project->current_stage,

                'status' =>
                    $project->status,

                'execution_status' =>
                    $project->execution_status,

                'next_stage' =>
                    $project->getNextStage(),
            ],
        ]);
    }

    public function moveToPreviousStage(
        Request $request,
        Project $project
    ) {
        $user = $request->user();

        if ($user && !$user->canTransferProject()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'ليس لديك صلاحية لإرجاع المشروع.',
            ], 403);
        }

        $previousStage =
            $project->getPreviousStage();

        if (!$previousStage) {
            return response()->json([
                'success' => false,
                'message' =>
                    'لا توجد مرحلة سابقة لهذا المشروع.',
            ], 422);
        }

        $validated = $request->validate([
            'notes' => [
                'required',
                'string',
                'max:5000',
            ],

            'assigned_to' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ]);

        $fromStage =
            $project->current_stage;

        DB::transaction(function () use (
            $project,
            $previousStage,
            $fromStage,
            $validated,
            $user,
            $request
        ) {
            $project->update([
                'current_stage' =>
                    $previousStage,

                'status' =>
                    'active',
            ]);

            ProjectWorkflowHistory::create([
                'project_id' =>
                    $project->id,

                'from_stage' =>
                    $fromStage,

                'to_stage' =>
                    $previousStage,

                'status' =>
                    'returned',

                'transferred_by' =>
                    $user?->id,

                'assigned_to' =>
                    $validated['assigned_to']
                    ?? null,

                'notes' =>
                    $validated['notes'],

                'transferred_at' =>
                    now(),
            ]);

            AuditLog::create([
                'user_id' =>
                    $user?->id,

                'action' =>
                    'returned',

                'module' =>
                    'project',

                'record_id' =>
                    $project->id,

                'title' =>
                    'تم إرجاع المشروع للقسم السابق',

                'description' =>
                    "تم إرجاع المشروع من {$fromStage} إلى {$previousStage}",

                'old_values' => [
                    'current_stage' =>
                        $fromStage,
                ],

                'new_values' => [
                    'current_stage' =>
                        $previousStage,
                ],

                'ip_address' =>
                    $request->ip(),

                'user_agent' =>
                    $request->userAgent(),
            ]);
        });

        $project->refresh();

        return response()->json([
            'success' => true,

            'message' =>
                'تم إرجاع المشروع بنجاح.',

            'data' => [
                'project_id' =>
                    $project->id,

                'current_stage' =>
                    $project->current_stage,

                'status' =>
                    $project->status,

                'previous_stage' =>
                    $project->getPreviousStage(),

                'next_stage' =>
                    $project->getNextStage(),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Execution Status
    |--------------------------------------------------------------------------
    */

    public function updateExecutionStatus(
        Request $request,
        Project $project
    ) {
        if ($project->current_stage !== 'execution') {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن تغيير حالة التنفيذ عندما يكون المشروع في قسم التنفيذ فقط.',
            ], 422);
        }

        $validated = $request->validate([
            'execution_status' => [
                'required',
                'string',
                'in:planned,ready,in_progress,site_preparation,installation,waiting_materials,waiting_customer,waiting_approval,blocked,on_hold,testing,handover,completed',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $oldStatus =
            $project->execution_status;

        $newStatus =
            $validated['execution_status'];

        $project->update([
            'execution_status' =>
                $newStatus,
        ]);

        AuditLog::create([
            'user_id' =>
                $request->user()?->id,

            'action' =>
                'execution_status_changed',

            'module' =>
                'project',

            'record_id' =>
                $project->id,

            'title' =>
                'تم تغيير حالة تنفيذ المشروع',

            'description' =>
                $validated['notes']
                ?? "تم تغيير حالة التنفيذ من {$oldStatus} إلى {$newStatus}",

            'old_values' => [
                'execution_status' =>
                    $oldStatus,
            ],

            'new_values' => [
                'execution_status' =>
                    $newStatus,
            ],

            'ip_address' =>
                $request->ip(),

            'user_agent' =>
                $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم تحديث حالة التنفيذ بنجاح.',

            'data' =>
                $project->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Hold Project
    |--------------------------------------------------------------------------
    */

    public function holdExecution(
        Request $request,
        Project $project
    ) {
        if ($project->current_stage !== 'execution') {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن إيقاف المشروع من مرحلة التنفيذ فقط.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => [
                'required',
                'string',
                'max:5000',
            ],
        ]);

        $oldStatus =
            $project->execution_status;

        $project->update([
            'execution_status' =>
                'on_hold',

            'execution_hold_reason' =>
                $validated['reason'],

            'execution_hold_at' =>
                now(),
        ]);

        AuditLog::create([
            'user_id' =>
                $request->user()?->id,

            'action' =>
                'execution_held',

            'module' =>
                'project',

            'record_id' =>
                $project->id,

            'title' =>
                'تم إيقاف تنفيذ المشروع',

            'description' =>
                $validated['reason'],

            'old_values' => [
                'execution_status' =>
                    $oldStatus,
            ],

            'new_values' => [
                'execution_status' =>
                    'on_hold',

                'execution_hold_reason' =>
                    $validated['reason'],
            ],

            'ip_address' =>
                $request->ip(),

            'user_agent' =>
                $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم إيقاف المشروع مؤقتًا.',

            'data' =>
                $project->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Resume Project
    |--------------------------------------------------------------------------
    */

    public function resumeExecution(
        Request $request,
        Project $project
    ) {
        if (
            $project->current_stage !== 'execution'
            ||
            $project->execution_status !== 'on_hold'
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'المشروع ليس موقوفًا حاليًا.',
            ], 422);
        }

        $project->update([
            'execution_status' =>
                'in_progress',

            'execution_hold_reason' =>
                null,

            'execution_resumed_at' =>
                now(),
        ]);

        AuditLog::create([
            'user_id' =>
                $request->user()?->id,

            'action' =>
                'execution_resumed',

            'module' =>
                'project',

            'record_id' =>
                $project->id,

            'title' =>
                'تم استئناف تنفيذ المشروع',

            'description' =>
                'تم استئناف المشروع وتحويل حالة التنفيذ إلى جاري التنفيذ.',

            'old_values' => [
                'execution_status' =>
                    'on_hold',
            ],

            'new_values' => [
                'execution_status' =>
                    'in_progress',
            ],

            'ip_address' =>
                $request->ip(),

            'user_agent' =>
                $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'تم استئناف المشروع بنجاح.',

            'data' =>
                $project->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Return Project To Specific Department
    |--------------------------------------------------------------------------
    */

    public function returnToStage(
        Request $request,
        Project $project
    ) {
        $user =
            $request->user();

        if ($user && !$user->canTransferProject()) {
            return response()->json([
                'success' => false,

                'message' =>
                    'ليس لديك صلاحية لإرجاع المشروع.',
            ], 403);
        }

        $validated = $request->validate([
            'target_stage' => [
                'required',
                'string',

                /*
                 * CRM هنا يمثل المبيعات/CRM في الهيكل الحالي.
                 */
                'in:sales,pricing,purchasing,finance',
            ],

            'reason' => [
                'required',
                'string',
                'max:5000',
            ],

            'assigned_to' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],
        ]);

        $fromStage =
            $project->current_stage;

        $targetStage =
            $validated['target_stage'];

        if ($fromStage === $targetStage) {
            return response()->json([
                'success' => false,

                'message' =>
                    'المشروع موجود بالفعل في هذا القسم.',
            ], 422);
        }

        DB::transaction(function () use (
            $project,
            $fromStage,
            $targetStage,
            $validated,
            $user,
            $request
        ) {
            $updateData = [
                'current_stage' => $targetStage,
                'status' => 'active',
            ];

            /*
             * عند رجوع المشروع من التنفيذ إلى التسعير
             * نطلب Revision رسمي ونحفظ سبب الرجوع.
             */
            if (
                $fromStage === 'execution'
                && $targetStage === 'pricing'
            ) {
                $updateData['quotation_revision_required'] = true;
                $updateData['quotation_revision_reason'] = $validated['reason'];
                $updateData['quotation_revision_requested_at'] = now();
            }

            /*
             * نحافظ على execution_status كما هي
             * حتى نعرف حالة التنفيذ قبل الرجوع.
             */
            $project->update($updateData);

            ProjectWorkflowHistory::create([
                'project_id' =>
                    $project->id,

                'from_stage' =>
                    $fromStage,

                'to_stage' =>
                    $targetStage,

                'status' =>
                    'returned',

                'transferred_by' =>
                    $user?->id,

                'assigned_to' =>
                    $validated['assigned_to']
                    ?? null,

                'notes' =>
                    $validated['reason'],

                'transferred_at' =>
                    now(),
            ]);

            AuditLog::create([
                'user_id' =>
                    $user?->id,

                'action' =>
                    'returned_to_stage',

                'module' =>
                    'project',

                'record_id' =>
                    $project->id,

                'title' =>
                    'تم إرجاع المشروع إلى قسم محدد',

                'description' =>
                    "تم إرجاع المشروع من {$fromStage} إلى {$targetStage}. السبب: {$validated['reason']}",

                'old_values' => [
                    'current_stage' =>
                        $fromStage,
                ],

                'new_values' => [
                    'current_stage' =>
                        $targetStage,

                    'reason' =>
                        $validated['reason'],
                ],

                'ip_address' =>
                    $request->ip(),

                'user_agent' =>
                    $request->userAgent(),
            ]);
        });

        return response()->json([
            'success' => true,

            'message' =>
                'تم إرجاع المشروع إلى القسم المطلوب بنجاح.',

            'data' =>
                $project->fresh(),
        ]);
    }

    public function index(Request $request)
    {
        $query =
            Project::query();

        if ($request->filled('stage')) {
            $query->where(
                'current_stage',
                $request->stage
            );
        }

        if ($request->filled('search')) {
            $search =
                $request->search;

            $query->where(
                function ($q) use ($search) {
                    $q
                        ->where(
                            'project_code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'customer_name',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'customer_code',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        if (
            $request->filled(
                'execution_status'
            )
        ) {
            $query->where(
                'execution_status',
                $request->execution_status
            );
        }

        if ($request->filled('priority')) {
            $query->where(
                'priority',
                $request->priority
            );
        }

        $projects =
            $query
                ->latest()
                ->get();

        return response()->json([
            'success' =>
                true,

            'count' =>
                $projects->count(),

            'data' =>
                $projects,
        ]);
    }
}