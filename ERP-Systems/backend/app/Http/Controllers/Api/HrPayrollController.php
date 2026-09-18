<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HrPayrollRun;
use App\Services\HrFieldResolver;
use App\Services\PayrollEngine;
use App\Services\WpsFileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * تشغيل الرواتب — معاد كتابته على جدولك المسطّح hr_payrolls.
 *
 * المسارات:
 *   GET  /hr/payroll-runs
 *   POST /hr/payroll-runs
 *   GET  /hr/payroll-runs/{payrollRun}
 *   POST /hr/payroll-runs/{payrollRun}/recalculate
 *   POST /hr/payroll-runs/{payrollRun}/approve
 *   POST /hr/payroll-runs/{payrollRun}/post
 *   POST /hr/payroll-runs/{payrollRun}/wps/validate
 *   POST /hr/payroll-runs/{payrollRun}/wps/generate
 *   GET  /hr/payroll-runs/{payrollRun}/wps/download
 */
class HrPayrollController extends Controller
{
    public function __construct(
        private readonly PayrollEngine $engine,
        private readonly WpsFileService $wps
    ) {}

    public function index(Request $request)
    {
        $runs = HrPayrollRun::query()
            ->with('branch:id,code,name')
            ->when($request->filled('year'), fn ($q) => $q->where('period_year', $request->year))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->get();

        $thisYear = $runs->where('period_year', now()->year);

        return response()->json([
            'success' => true,
            'summary' => [
                'runs_count' => $runs->count(),
                'posted_count' => $runs->where('status', 'posted')->count(),
                'pending_wps' => $runs
                    ->whereIn('status', ['approved', 'posted'])
                    ->whereNull('wps_submitted_at')
                    ->count(),
                'ytd_gross' => round((float) $thisYear->sum('total_gross'), 2),
                'ytd_gosi_employer' => round((float) $thisYear->sum('total_gosi_employer'), 2),
                'ytd_employer_cost' => round((float) $thisYear->sum(
                    fn ($r) => $r->employer_cost
                ), 2),
            ],
            'data' => $runs,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'branch_id' => ['nullable', 'integer', 'exists:hr_branches,id'],
        ]);

        $run = $this->engine->run(
            (int) $validated['year'],
            (int) $validated['month'],
            $validated['branch_id'] ?? null,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => sprintf(
                'تم حساب رواتب %d موظف بإجمالي صافي %s ريال.',
                $run->employees_count,
                number_format((float) $run->total_net, 2)
            ),
            'data' => $run,
        ], 201);
    }

    public function show(HrPayrollRun $payrollRun)
    {
        $payrollRun->load([
            'branch:id,code,name',
            'journalEntry:id,entry_number,entry_date,status',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                ...$payrollRun->toArray(),
                'employer_cost' => $payrollRun->employer_cost,
                'lines' => $this->lines($payrollRun),
            ],
        ]);
    }

    public function recalculate(Request $request, HrPayrollRun $payrollRun)
    {
        if (in_array($payrollRun->status, ['posted', 'paid'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن إعادة حساب تشغيل مُرحَّل.',
            ], 422);
        }

        $payrollRun->update(['status' => 'draft']);

        $run = $this->engine->run(
            (int) $payrollRun->period_year,
            (int) $payrollRun->period_month,
            $payrollRun->branch_id,
            $request->user()?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة الحساب.',
            'data' => $run,
        ]);
    }

    public function approve(Request $request, HrPayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'calculated') {
            return response()->json([
                'success' => false,
                'message' => 'يجب حساب التشغيل أولًا قبل الاعتماد.',
            ], 422);
        }

        $payrollRun->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        DB::table('hr_payrolls')
            ->where('payroll_run_id', $payrollRun->id)
            ->update([
                'status' => 'approved',
                'approved_by' => $request->user()?->id,
                'approved_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'تم اعتماد تشغيل الرواتب.',
            'data' => $payrollRun->fresh(),
        ]);
    }

    public function post(Request $request, HrPayrollRun $payrollRun)
    {
        $run = $this->engine->post($payrollRun, $request->user()?->id);

        return response()->json([
            'success' => true,
            'message' => 'تم ترحيل قيد الرواتب.',
            'data' => $run->load('journalEntry'),
        ]);
    }

    public function validateWps(HrPayrollRun $payrollRun)
    {
        $result = $this->wps->validate($payrollRun);

        return response()->json([
            'success' => true,
            'message' => $result['is_valid']
                ? 'الملف جاهز للرفع — مافيش أخطاء.'
                : sprintf('فيه %d خطأ يمنع الرفع.', count($result['errors'])),
            'data' => $result,
        ]);
    }

    public function generateWps(HrPayrollRun $payrollRun)
    {
        $result = $this->wps->generate($payrollRun);

        if (!$result['generated']) {
            return response()->json([
                'success' => false,
                'message' => 'الفحص المسبق فشل — صحّح الأخطاء قبل التوليد.',
                'data' => $result['validation'],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => sprintf(
                'تم توليد ملف حماية الأجور — %d موظف بإجمالي %s ريال.',
                $result['rows'],
                number_format($result['total_net'], 2)
            ),
            'data' => $result,
        ]);
    }

    public function downloadWps(HrPayrollRun $payrollRun)
    {
        if (!$payrollRun->wps_file_path
            || !Storage::disk('local')->exists($payrollRun->wps_file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود — ولّده أولًا.',
            ], 404);
        }

        return Storage::disk('local')->download(
            $payrollRun->wps_file_path,
            sprintf('WPS-%d-%02d.csv', $payrollRun->period_year, $payrollRun->period_month)
        );
    }

    /** بنود التشغيل من جدولك المسطّح مع بيانات الموظف. */
    private function lines(HrPayrollRun $run): array
    {
        $key = HrFieldResolver::employeeKey('hr_payrolls');

        return DB::table('hr_payrolls as p')
            ->join('hr_employees as e', 'e.id', '=', "p.{$key}")
            ->leftJoin('cost_centers as cc', 'cc.id', '=', 'p.cost_center_id')
            ->where('p.payroll_run_id', $run->id)
            ->orderBy('e.employee_number')
            ->select([
                'p.*',
                'e.employee_number',
                'e.first_name',
                'e.last_name',
                'e.iban',
                'cc.name as cost_center_name',
            ])
            ->get()
            ->map(fn ($row) => [
                ...(array) $row,
                'employee_name' => trim($row->first_name . ' ' . $row->last_name),
                'scheme_label' => match ($row->gosi_scheme ?? null) {
                    'expat' => 'وافد · أخطار مهنية',
                    'existing' => 'سعودي · النظام القديم',
                    'new' => 'سعودي · النظام الجديد',
                    default => '—',
                },
                'project_allocations' => $row->project_allocations
                    ? json_decode($row->project_allocations, true)
                    : null,
            ])
            ->all();
    }
}
