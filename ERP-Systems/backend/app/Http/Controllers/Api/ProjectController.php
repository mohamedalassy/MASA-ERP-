<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\CustomerContact;
use App\Models\Project;
use App\Models\ProjectWorkflowHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | List Projects
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $query = Project::query()
            ->with([
                'branch:id,code,name,name_en',
                'customer:id,branch_id,code,name,name_en,phone,email,commercial_register,tax_number',
                'customerContact:id,customer_id,name,job_title,mobile,email',
            ]);

        if ($request->filled('branch_id')) {
            $query->where(
                'branch_id',
                $request->integer('branch_id')
            );
        }

        if ($request->filled('customer_id')) {
            $query->where(
                'customer_id',
                $request->integer('customer_id')
            );
        }

        if ($request->filled('stage')) {
            $query->where(
                'current_stage',
                $request->stage
            );
        }

        if ($request->filled('search')) {
            $search = trim(
                $request->string('search')->toString()
            );

            $query->where(function ($q) use ($search) {
                $q->where(
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
                        'customer_name_en',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'customer_code',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'commercial_register',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'tax_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        if ($request->filled('execution_status')) {
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

        $projects = $query
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'count' => $projects->count(),
            'data' => $projects,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Create Project
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => [
                'nullable',
                'integer',
                'exists:branches,id',
            ],

            'customer_id' => [
                'required',
                'integer',
                'exists:customers,id',
            ],

            'customer_contact_id' => [
                'nullable',
                'integer',
                'exists:customer_contacts,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'project_type' => [
                'nullable',
                'string',
                'max:100',
            ],

            'priority' => [
                'nullable',
                Rule::in([
                    'low',
                    'normal',
                    'high',
                    'urgent',
                ]),
            ],

            'project_manager' => [
                'nullable',
                'string',
                'max:255',
            ],

            'account_manager' => [
                'nullable',
                'string',
                'max:255',
            ],

            'expected_start_date' => [
                'nullable',
                'date',
            ],

            'expected_end_date' => [
                'nullable',
                'date',
                'after_or_equal:expected_start_date',
            ],

            'total_value' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | Project Site
            |--------------------------------------------------------------------------
            */

            'site_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'site_address' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'site_city' => [
                'nullable',
                'string',
                'max:255',
            ],

            'site_region' => [
                'nullable',
                'string',
                'max:255',
            ],

            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            'attendance_radius' => [
                'nullable',
                'integer',
                'min:10',
                'max:10000',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Customer
        |--------------------------------------------------------------------------
        */

        $customer = Customer::query()
            ->with('contacts')
            ->findOrFail(
                $validated['customer_id']
            );

        /*
        |--------------------------------------------------------------------------
        | Branch
        |--------------------------------------------------------------------------
        */

        $branchId =
            $validated['branch_id']
            ?? $customer->branch_id;

        /*
         * لو العميل مربوط بفرع بالفعل
         * لا نسمح بإنشاء المشروع على فرع مختلف.
         */

        if (
            $customer->branch_id &&
            $branchId &&
            (int) $customer->branch_id !==
            (int) $branchId
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'فرع المشروع يجب أن يطابق فرع العميل.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Customer Contact
        |--------------------------------------------------------------------------
        */

        $contact = null;

        if (
            !empty(
                $validated['customer_contact_id']
            )
        ) {
            $contact = CustomerContact::query()
                ->where(
                    'customer_id',
                    $customer->id
                )
                ->find(
                    $validated['customer_contact_id']
                );

            if (!$contact) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'جهة الاتصال المحددة لا تتبع هذا العميل.',
                ], 422);
            }
        } else {
            /*
             * لو المستخدم لم يحدد Contact
             * نستخدم Primary Contact تلقائيًا.
             */

            $contact = $customer
                ->contacts
                ->firstWhere(
                    'is_primary',
                    true
                );
        }

        /*
        |--------------------------------------------------------------------------
        | Create
        |--------------------------------------------------------------------------
        */

        $project = DB::transaction(
            function () use (
                $validated,
                $customer,
                $contact,
                $branchId,
                $request
            ) {
                $projectCode =
                    $this->generateProjectCode();

                $project = Project::create([
                    /*
                    |--------------------------------------------------------------------------
                    | Relations
                    |--------------------------------------------------------------------------
                    */

                    'branch_id' =>
                        $branchId,

                    'customer_id' =>
                        $customer->id,

                    'customer_contact_id' =>
                        $contact?->id,

                    /*
                    |--------------------------------------------------------------------------
                    | Project
                    |--------------------------------------------------------------------------
                    */

                    'project_code' =>
                        $projectCode,

                    'name' =>
                        $validated['name'],

                    /*
                    |--------------------------------------------------------------------------
                    | Customer Snapshot
                    |--------------------------------------------------------------------------
                    */

                    'customer_name' =>
                        $customer->name,

                    'customer_name_en' =>
                        $customer->name_en,

                    'customer_code' =>
                        $customer->code,

                    'customer_industry' =>
                        $customer->industry,

                    'phone' =>
                        $customer->phone,

                    'email' =>
                        $customer->email,

                    'customer_website' =>
                        $customer->website,

                    'address' =>
                        $customer->address,

                    'customer_city' =>
                        $customer->city,

                    'customer_region' =>
                        $customer->region,

                    'customer_country' =>
                        $customer->country,

                    'commercial_register' =>
                        $customer->commercial_register,

                    'tax_number' =>
                        $customer->tax_number,

                    /*
                    |--------------------------------------------------------------------------
                    | Contact Snapshot
                    |--------------------------------------------------------------------------
                    */

                    'contact_name' =>
                        $contact?->name,

                    'contact_job_title' =>
                        $contact?->job_title,

                    'contact_department' =>
                        $contact?->department,

                    'contact_phone' =>
                        $contact?->phone,

                    'contact_mobile' =>
                        $contact?->mobile,

                    'contact_email' =>
                        $contact?->email,

                    /*
                    |--------------------------------------------------------------------------
                    | Project Team
                    |--------------------------------------------------------------------------
                    */

                    'project_manager' =>
                        $validated['project_manager']
                        ?? null,

                    'account_manager' =>
                        $validated['account_manager']
                        ?? null,

                    /*
                    |--------------------------------------------------------------------------
                    | Project Details
                    |--------------------------------------------------------------------------
                    */

                    'project_type' =>
                        $validated['project_type']
                        ?? null,

                    'priority' =>
                        $validated['priority']
                        ?? 'normal',

                    'expected_start_date' =>
                        $validated[
                            'expected_start_date'
                        ]
                        ?? null,

                    'expected_end_date' =>
                        $validated[
                            'expected_end_date'
                        ]
                        ?? null,

                    'total_value' =>
                        $validated['total_value']
                        ?? 0,

                    /*
                    |--------------------------------------------------------------------------
                    | Project Site
                    |--------------------------------------------------------------------------
                    */

                    'site_name' =>
                        $validated['site_name']
                        ?? null,

                    'site_address' =>
                        $validated['site_address']
                        ?? null,

                    'site_city' =>
                        $validated['site_city']
                        ?? null,

                    'site_region' =>
                        $validated['site_region']
                        ?? null,

                    'latitude' =>
                        $validated['latitude']
                        ?? null,

                    'longitude' =>
                        $validated['longitude']
                        ?? null,

                    'attendance_radius' =>
                        $validated['attendance_radius']
                        ?? 100,

                    /*
                    |--------------------------------------------------------------------------
                    | Workflow
                    |--------------------------------------------------------------------------
                    */

                    'current_stage' =>
                        'crm',

                    'status' =>
                        'active',

                    /*
                    |--------------------------------------------------------------------------
                    | System
                    |--------------------------------------------------------------------------
                    */

                    'created_by' =>
                        $request->user()?->id,
                ]);

                /*
                |--------------------------------------------------------------------------
                | Initial Workflow History
                |--------------------------------------------------------------------------
                */

                ProjectWorkflowHistory::create([
                    'project_id' =>
                        $project->id,

                    'from_stage' =>
                        null,

                    'to_stage' =>
                        'crm',

                    'status' =>
                        'completed',

                    'transferred_by' =>
                        $request->user()?->id,

                    'assigned_to' =>
                        null,

                    'notes' =>
                        'تم إنشاء المشروع.',

                    'transferred_at' =>
                        now(),
                ]);

                /*
                |--------------------------------------------------------------------------
                | Audit
                |--------------------------------------------------------------------------
                */

                AuditLog::create([
                    'user_id' =>
                        $request->user()?->id,

                    'action' =>
                        'created',

                    'module' =>
                        'project',

                    'record_id' =>
                        $project->id,

                    'title' =>
                        'تم إنشاء مشروع جديد',

                    'description' =>
                        "تم إنشاء المشروع {$project->project_code} - {$project->name}",

                    'old_values' =>
                        null,

                    'new_values' => [
                        'project_code' =>
                            $project->project_code,

                        'name' =>
                            $project->name,

                        'customer_id' =>
                            $project->customer_id,

                        'customer_name' =>
                            $project->customer_name,

                        'current_stage' =>
                            $project->current_stage,

                        'status' =>
                            $project->status,
                    ],

                    'ip_address' =>
                        $request->ip(),

                    'user_agent' =>
                        $request->userAgent(),
                ]);

                return $project;
            }
        );

        /*
        |--------------------------------------------------------------------------
        | Response
        |--------------------------------------------------------------------------
        */

        $project->load([
            'branch',
            'customer',
            'customerContact',
            'creator',
            'workflowHistory.transferredBy',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'تم إنشاء المشروع بنجاح.',
            'data' =>
                $project,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | Show Project
    |--------------------------------------------------------------------------
    */

    public function show(Project $project)
    {
        $project->load([
            'branch',

            'customer.branch',
            'customer.contacts',

            'customerContact',

            'creator',

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

    /*
    |--------------------------------------------------------------------------
    | Move To Next Stage
    |--------------------------------------------------------------------------
    */

    public function moveToNextStage(
        Request $request,
        Project $project
    ) {
        $user = $request->user();

        if (
            $user &&
            !$user->canTransferProject()
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'ليس لديك صلاحية لنقل المشروع.',
            ], 403);
        }

        /*
         * لا نسمح بخروج المشروع من التسعير
         * قبل اعتماد أحدث عرض سعر.
         */

        if (
            $project->current_stage ===
            'pricing'
        ) {
            $latestQuotation =
                $project
                    ->quotations()
                    ->orderByDesc('version')
                    ->orderByDesc('id')
                    ->first();

            if (!$latestQuotation) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'يجب إنشاء عرض سعر واعتماده قبل إرسال المشروع للقسم التالي.',
                ], 422);
            }

            if (
                $project
                    ->quotation_revision_required
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'يوجد تعديل مطلوب على عرض السعر. أنشئ Revision جديد أولاً.',
                ], 422);
            }

            if (
                $latestQuotation->status !==
                'approved'
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'يجب اعتماد أحدث عرض سعر قبل إرسال المشروع للقسم التالي.',
                ], 422);
            }
        }

        $nextStage =
            $project->getNextStage();

        if (!$nextStage) {
            return response()->json([
                'success' => false,
                'message' =>
                    'المشروع موجود بالفعل في آخر مرحلة.',
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

        $fromStage =
            $project->current_stage;

        DB::transaction(
            function () use (
                $project,
                $nextStage,
                $fromStage,
                $validated,
                $user,
                $request
            ) {
                $updateData = [
                    'current_stage' =>
                        $nextStage,

                    'status' =>
                        $nextStage === 'closed'
                            ? 'completed'
                            : 'active',
                ];

                /*
                 * أول ما المشروع يدخل التنفيذ
                 * نبدأ بحالة جاهز للبدء.
                 */

                if (
                    $nextStage === 'execution' &&
                    !$project->execution_status
                ) {
                    $updateData[
                        'execution_status'
                    ] = 'ready';
                }

                $project->update(
                    $updateData
                );

                ProjectWorkflowHistory::create([
                    'project_id' =>
                        $project->id,

                    'from_stage' =>
                        $fromStage,

                    'to_stage' =>
                        $nextStage,

                    'status' =>
                        'completed',

                    'transferred_by' =>
                        $user?->id,

                    'assigned_to' =>
                        $validated['assigned_to']
                        ?? null,

                    'notes' =>
                        $validated['notes']
                        ?? null,

                    'transferred_at' =>
                        now(),
                ]);

                AuditLog::create([
                    'user_id' =>
                        $user?->id,

                    'action' =>
                        'transferred',

                    'module' =>
                        'project',

                    'record_id' =>
                        $project->id,

                    'title' =>
                        'تم نقل المشروع إلى قسم جديد',

                    'description' =>
                        "تم نقل المشروع من {$fromStage} إلى {$nextStage}",

                    'old_values' => [
                        'current_stage' =>
                            $fromStage,
                    ],

                    'new_values' => [
                        'current_stage' =>
                            $nextStage,
                    ],

                    'ip_address' =>
                        $request->ip(),

                    'user_agent' =>
                        $request->userAgent(),
                ]);
            }
        );

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

    /*
    |--------------------------------------------------------------------------
    | Move To Previous Stage
    |--------------------------------------------------------------------------
    */

    public function moveToPreviousStage(
        Request $request,
        Project $project
    ) {
        $user =
            $request->user();

        if (
            $user &&
            !$user->canTransferProject()
        ) {
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

        DB::transaction(
            function () use (
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
            }
        );

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
        if (
            $project->current_stage !==
            'execution'
        ) {
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
            $validated[
                'execution_status'
            ];

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
    | Hold Execution
    |--------------------------------------------------------------------------
    */

    public function holdExecution(
        Request $request,
        Project $project
    ) {
        if (
            $project->current_stage !==
            'execution'
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'يمكن إيقاف المشروع من مرحلة التنفيذ فقط.',
            ], 422);
        }

        $validated =
            $request->validate([
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
    | Resume Execution
    |--------------------------------------------------------------------------
    */

    public function resumeExecution(
        Request $request,
        Project $project
    ) {
        if (
            $project->current_stage !==
            'execution'
            ||
            $project->execution_status !==
            'on_hold'
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
    | Return Project To Specific Stage
    |--------------------------------------------------------------------------
    */

    public function returnToStage(
        Request $request,
        Project $project
    ) {
        $user =
            $request->user();

        if (
            $user &&
            !$user->canTransferProject()
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'ليس لديك صلاحية لإرجاع المشروع.',
            ], 403);
        }

        $validated =
            $request->validate([
                'target_stage' => [
                    'required',
                    'string',
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
            $validated[
                'target_stage'
            ];

        if (
            $fromStage ===
            $targetStage
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'المشروع موجود بالفعل في هذا القسم.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $project,
                $fromStage,
                $targetStage,
                $validated,
                $user,
                $request
            ) {
                $updateData = [
                    'current_stage' =>
                        $targetStage,

                    'status' =>
                        'active',
                ];

                if (
                    $fromStage === 'execution'
                    &&
                    $targetStage === 'pricing'
                ) {
                    $updateData[
                        'quotation_revision_required'
                    ] = true;

                    $updateData[
                        'quotation_revision_reason'
                    ] =
                        $validated['reason'];

                    $updateData[
                        'quotation_revision_requested_at'
                    ] =
                        now();
                }

                $project->update(
                    $updateData
                );

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
            }
        );

        $project->refresh();

        return response()->json([
            'success' => true,

            'message' =>
                'تم إرجاع المشروع إلى القسم المطلوب بنجاح.',

            'data' =>
                $project,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Project Code
    |--------------------------------------------------------------------------
    */

    private function generateProjectCode(): string
    {
        $prefix =
            'PRJ-' .
            now()->format('Y') .
            '-';

        $lastProject =
            Project::query()
                ->where(
                    'project_code',
                    'like',
                    $prefix . '%'
                )
                ->orderByDesc('id')
                ->first();

        $nextNumber = 1;

        if ($lastProject) {
            $lastNumber =
                (int) str_replace(
                    $prefix,
                    '',
                    $lastProject->project_code
                );

            $nextNumber =
                $lastNumber + 1;
        }

        do {
            $code =
                $prefix .
                str_pad(
                    (string) $nextNumber,
                    5,
                    '0',
                    STR_PAD_LEFT
                );

            $exists =
                Project::query()
                    ->where(
                        'project_code',
                        $code
                    )
                    ->exists();

            $nextNumber++;
        } while ($exists);

        return $code;
    }
}