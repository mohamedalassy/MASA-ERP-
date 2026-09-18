<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HrPayroll;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\HrEmployee;
use App\Models\HrEmployeeContract;
use Carbon\Carbon;

class HrPayrollController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'year' => ['required', 'integer', 'min:2000', 'max:2200'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        $start = Carbon::create($data['year'], $data['month'], 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $created = 0;

        HrEmployee::query()->where('status', 'active')->each(function (HrEmployee $employee) use ($data, $start, $end, &$created) {
            $contract = HrEmployeeContract::query()
                ->where('employee_id', $employee->id)
                ->where('status', 'active')
                ->whereDate('start_date', '<=', $end)
                ->where(function ($q) use ($start) {
                    $q->whereNull('end_date')->orWhereDate('end_date', '>=', $start);
                })
                ->latest('start_date')->first();

            if (!$contract || HrPayroll::where(['employee_id' => $employee->id, 'year' => $data['year'], 'month' => $data['month']])->exists()) {
                return;
            }

            $allowances = (float) $contract->housing_allowance + (float) $contract->transport_allowance + (float) $contract->other_allowances;
            $basic = (float) $contract->basic_salary;
            HrPayroll::create([
                'employee_id' => $employee->id, 'year' => $data['year'], 'month' => $data['month'],
                'period_start' => $start, 'period_end' => $end, 'basic_salary' => $basic,
                'allowances' => $allowances, 'gross_salary' => $basic + $allowances,
                'net_salary' => $basic + $allowances, 'status' => 'draft',
            ]);
            $created++;
        });

        return response()->json(['created' => $created, 'year' => $data['year'], 'month' => $data['month']]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = HrPayroll::with('employee:id,full_name,first_name,last_name')
            ->when($request->year, fn ($q, $v) => $q->where('year', $v))
            ->when($request->month, fn ($q, $v) => $q->where('month', $v))
            ->latest();

        return response()->json($query->paginate($request->integer('per_page', 25)));
    }

    public function show(HrPayroll $hrPayroll): JsonResponse
    {
        return response()->json($hrPayroll->load('employee'));
    }

    public function update(Request $request, HrPayroll $hrPayroll): JsonResponse
    {
        if (in_array($hrPayroll->status, ['paid', 'closed'], true)) {
            return response()->json(['message' => 'لا يمكن تعديل مسير مغلق أو مدفوع.'], 422);
        }

        $data = $request->validate([
            'bonuses' => ['nullable', 'numeric', 'min:0'],
            'loans_deductions' => ['nullable', 'numeric', 'min:0'],
            'other_deductions' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:draft,review,approved'],
            'notes' => ['nullable', 'string'],
        ]);

        $hrPayroll->fill($data);
        $hrPayroll->gross_salary = $hrPayroll->basic_salary + $hrPayroll->allowances + $hrPayroll->overtime_amount + $hrPayroll->bonuses;
        $hrPayroll->total_deductions = $hrPayroll->absence_deductions + $hrPayroll->late_deductions + $hrPayroll->loans_deductions + $hrPayroll->other_deductions;
        $hrPayroll->net_salary = max(0, $hrPayroll->gross_salary - $hrPayroll->total_deductions);
        $hrPayroll->save();

        return response()->json($hrPayroll->fresh()->load('employee'));
    }
}
