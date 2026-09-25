<?php

namespace App\Http\Controllers\Api\HrV2;

use App\Http\Controllers\Controller;
use App\Models\HrEmployee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PayrollEmployeeSetupController extends Controller
{
    public function __invoke(Request $request)
    {
        $data = $request->validate([
            'employee_number' => ['required', 'string', 'max:30', Rule::unique('hr_employees', 'employee_number')],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'branch_id' => ['nullable', 'integer', 'exists:hr_branches,id'],
            'hire_date' => ['required', 'date'],
            'nationality_type' => ['required', Rule::in(['saudi', 'gcc', 'expat'])],
            'gosi_subscribed' => ['required', 'boolean'],
            'gosi_first_registration_date' => ['nullable', 'required_if:gosi_subscribed,1', 'date'],
            'contract_number' => ['nullable', 'string', 'max:80'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'basic_salary' => ['required', 'numeric', 'gt:0'],
            'housing_allowance' => ['required', 'numeric', 'min:0'],
            'transport_allowance' => ['required', 'numeric', 'min:0'],
            'other_allowances' => ['required', 'numeric', 'min:0'],
        ]);

        $employee = DB::transaction(function () use ($data, $request) {
            $employee = HrEmployee::create([
                'employee_number' => $data['employee_number'],
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'branch_id' => $data['branch_id'] ?? null,
                'hire_date' => $data['hire_date'],
                'nationality_type' => $data['nationality_type'],
                'gosi_subscribed' => $data['gosi_subscribed'],
                'gosi_first_registration_date' => $data['gosi_first_registration_date'] ?? null,
                'employment_type' => 'full_time',
                'status' => 'active',
                'is_active' => true,
                'created_by' => $request->user()?->id,
            ]);
            $employee->contracts()->create([
                'contract_number' => $data['contract_number'] ?? null,
                'contract_type' => 'employment',
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'basic_salary' => $data['basic_salary'],
                'housing_allowance' => $data['housing_allowance'],
                'transport_allowance' => $data['transport_allowance'],
                'other_allowances' => $data['other_allowances'],
                'currency' => 'SAR',
                'status' => 'active',
            ]);
            return $employee;
        });

        return response()->json(['success' => true, 'data' => $employee->load('contracts')], 201);
    }
}
