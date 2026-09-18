<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * رأس تشغيل الرواتب — فوق جدولك hr_payrolls.
 *
 * جدولك المسطّح يفضل هو البنود، وده بيضيف كيان تعتمده وترحّله ككل.
 */
class HrPayrollRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'run_number', 'period_year', 'period_month', 'branch_id',
        'status', 'employees_count',
        'total_gross', 'total_deductions', 'total_gosi_employee',
        'total_gosi_employer', 'total_net', 'total_eosb_accrual',
        'finance_journal_entry_id',
        'wps_file_path', 'wps_generated_at', 'wps_submitted_at',
        'wps_validation_status', 'wps_validation_errors',
        'created_by', 'approved_by', 'approved_at', 'posted_at', 'notes',
    ];

    protected $casts = [
        'period_year' => 'integer',
        'period_month' => 'integer',
        'employees_count' => 'integer',
        'total_gross' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_gosi_employee' => 'decimal:2',
        'total_gosi_employer' => 'decimal:2',
        'total_net' => 'decimal:2',
        'total_eosb_accrual' => 'decimal:2',
        'wps_validation_errors' => 'array',
        'wps_generated_at' => 'datetime',
        'wps_submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'posted_at' => 'datetime',
    ];

    public function lines(): HasMany
    {
        return $this->hasMany(HrPayroll::class, 'payroll_run_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(HrBranch::class, 'branch_id');
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(
            FinanceJournalEntry::class,
            'finance_journal_entry_id'
        );
    }

    /** إجمالي تكلفة صاحب العمل = الإجمالي + حصته + المخصص. */
    public function getEmployerCostAttribute(): float
    {
        return round(
            (float) $this->total_gross
            + (float) $this->total_gosi_employer
            + (float) $this->total_eosb_accrual,
            2
        );
    }

    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'calculated'], true);
    }
}
