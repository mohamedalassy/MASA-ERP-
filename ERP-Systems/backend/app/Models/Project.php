<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        /*
        |--------------------------------------------------------------------------
        | Relations
        |--------------------------------------------------------------------------
        */

        'branch_id',
        'customer_id',
        'customer_contact_id',

        /*
        |--------------------------------------------------------------------------
        | Project
        |--------------------------------------------------------------------------
        */

        'project_code',
        'name',

        /*
        |--------------------------------------------------------------------------
        | Customer Snapshot
        |--------------------------------------------------------------------------
        */

        'customer_name',
        'customer_name_en',
        'customer_code',
        'customer_industry',

        'phone',
        'email',
        'customer_website',

        'address',
        'customer_city',
        'customer_region',
        'customer_country',

        'commercial_register',
        'tax_number',

        /*
        |--------------------------------------------------------------------------
        | Customer Contact Snapshot
        |--------------------------------------------------------------------------
        */

        'contact_name',
        'contact_job_title',
        'contact_department',
        'contact_phone',
        'contact_mobile',
        'contact_email',

        /*
        |--------------------------------------------------------------------------
        | Project Site
        |--------------------------------------------------------------------------
        */

        'site_name',
        'site_address',
        'site_city',
        'site_region',

        'latitude',
        'longitude',
        'attendance_radius',

        /*
        |--------------------------------------------------------------------------
        | Project Team
        |--------------------------------------------------------------------------
        */

        'project_manager',
        'account_manager',

        /*
        |--------------------------------------------------------------------------
        | Workflow
        |--------------------------------------------------------------------------
        */

        'current_stage',
        'status',

        /*
        |--------------------------------------------------------------------------
        | Execution
        |--------------------------------------------------------------------------
        */

        'execution_status',
        'execution_hold_reason',
        'execution_hold_at',
        'execution_resumed_at',

        /*
        |--------------------------------------------------------------------------
        | Project Details
        |--------------------------------------------------------------------------
        */

        'project_type',
        'priority',

        'expected_start_date',
        'expected_end_date',

        'total_value',

        /*
        |--------------------------------------------------------------------------
        | System
        |--------------------------------------------------------------------------
        */

        'created_by',

        /*
        |--------------------------------------------------------------------------
        | Quotation Revision
        |--------------------------------------------------------------------------
        */

        'quotation_revision_required',
        'quotation_revision_reason',
        'quotation_revision_requested_at',
    ];

    protected $casts = [
        'expected_start_date' => 'date',
        'expected_end_date' => 'date',

        'total_value' => 'decimal:2',

        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',

        'attendance_radius' => 'integer',

        'execution_hold_at' => 'datetime',
        'execution_resumed_at' => 'datetime',

        'quotation_revision_required' => 'boolean',
        'quotation_revision_requested_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Core Relationships
    |--------------------------------------------------------------------------
    */

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function customerContact()
    {
        return $this->belongsTo(
            CustomerContact::class,
            'customer_contact_id'
        );
    }

    public function creator()
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Project Relationships
    |--------------------------------------------------------------------------
    */

    public function workflowHistory()
    {
        return $this->hasMany(
            ProjectWorkflowHistory::class
        )->latest('transferred_at');
    }

    public function notes()
    {
        return $this->hasMany(
            ProjectNote::class
        )->latest();
    }

    public function attachments()
    {
        return $this->hasMany(
            ProjectAttachment::class
        )->latest();
    }

    public function quotations()
    {
        return $this->hasMany(
            ProjectQuotation::class
        )->latest();
    }

    public function purchaseOrders()
    {
        return $this->hasMany(
            PurchaseOrder::class
        )->latest();
    }

    public function financialTransactions()
    {
        return $this->hasMany(
            ProjectFinancialTransaction::class
        )->latest();
    }

    /*
    |--------------------------------------------------------------------------
    | Workflow
    |--------------------------------------------------------------------------
    */

    public static function workflowStages(): array
    {
        return [
            'crm',
            'sales',
            'pricing',
            'purchasing',
            'finance',
            'execution',
            'closed',
        ];
    }

    public function getNextStage(): ?string
    {
        $stages = static::workflowStages();

        $currentIndex = array_search(
            $this->current_stage,
            $stages,
            true
        );

        if ($currentIndex === false) {
            return null;
        }

        return $stages[$currentIndex + 1] ?? null;
    }

    public function canMoveToNextStage(): bool
    {
        return $this->getNextStage() !== null;
    }

    public function getPreviousStage(): ?string
    {
        $stages = static::workflowStages();

        $currentIndex = array_search(
            $this->current_stage,
            $stages,
            true
        );

        if (
            $currentIndex === false ||
            $currentIndex === 0
        ) {
            return null;
        }

        return $stages[$currentIndex - 1];
    }

    public function canMoveToPreviousStage(): bool
    {
        return $this->getPreviousStage() !== null;
    }
}