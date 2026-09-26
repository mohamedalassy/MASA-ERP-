<?php
namespace App\Http\Controllers\Api\HrV2;

use App\Http\Controllers\Controller;
use App\Models\HrLeaveRequest;
use App\Models\HrRoster;
use App\Models\HrEmployee;
use App\Models\HrShift;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RosterController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from',
            'employee_id' => 'nullable|integer|exists:hr_employees,id', 'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);
        $query = HrRoster::with(['employee:id,employee_number,first_name,last_name', 'shift:id,code,name,start_time,end_time']);
        if (isset($filters['from'])) $query->whereDate('work_date', '>=', $filters['from']);
        if (isset($filters['to'])) $query->whereDate('work_date', '<=', $filters['to']);
        if (isset($filters['employee_id'])) $query->where('employee_id', $filters['employee_id']);
        return response()->json($query->orderBy('work_date')->orderBy('employee_id')->paginate($filters['per_page'] ?? 100));
    }

    public function store(Request $request)
    {
        $data = $this->data($request);
        $this->checkLeave($data['employee_id'], $data['work_date'], $data['status']);
        if (HrRoster::where('employee_id', $data['employee_id'])->whereDate('work_date', $data['work_date'])->exists())
            throw ValidationException::withMessages(['work_date' => ['يوجد جدول لهذا الموظف في نفس اليوم؛ افتحه وعدّل السجل الموجود.']]);
        return response()->json(HrRoster::create($data)->load(['employee', 'shift']), 201);
    }

    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|integer|exists:hr_employees,id',
            'shift_id' => 'required|integer|exists:hr_shifts,id',
            'from' => 'required|date_format:Y-m-d',
            'to' => 'required|date_format:Y-m-d|after_or_equal:from',
            'notes' => 'nullable|string|max:1000',
        ]);
        $from = CarbonImmutable::createFromFormat('!Y-m-d', $data['from']);
        $to = CarbonImmutable::createFromFormat('!Y-m-d', $data['to']);
        if ($from->diffInDays($to) > 61)
            throw ValidationException::withMessages(['to' => ['الحد الأقصى للتوزيع 62 يومًا.']]);

        $shift = HrShift::findOrFail($data['shift_id']);
        if (!$shift->is_active || !is_array($shift->working_days) || !$shift->working_days)
            throw ValidationException::withMessages(['shift_id' => ['اختر وردية نشطة وحدد أيام عملها أولًا.']]);
        $workingDays = array_map('intval', $shift->working_days);

        $counts = DB::transaction(function () use ($data, $from, $to, $shift, $workingDays) {
            // Serialize schedules for one employee so concurrent bulk requests cannot double book a day.
            HrEmployee::whereKey($data['employee_id'])->lockForUpdate()->firstOrFail();
            $existing = HrRoster::where('employee_id', $data['employee_id'])
                ->whereBetween('work_date', [$data['from'], $data['to']])->pluck('work_date')
                ->mapWithKeys(fn ($date) => [substr((string) $date, 0, 10) => true])->all();
            $leaves = HrLeaveRequest::where('employee_id', $data['employee_id'])->where('status', 'approved')
                ->whereDate('start_date', '<=', $data['to'])->whereDate('end_date', '>=', $data['from'])
                ->get(['start_date', 'end_date']);
            $result = ['created' => 0, 'skipped_existing' => 0, 'skipped_leave' => 0, 'skipped_days_off' => 0];
            for ($day = $from; $day->lte($to); $day = $day->addDay()) {
                $date = $day->toDateString();
                if (!in_array($day->dayOfWeek, $workingDays, true)) { $result['skipped_days_off']++; continue; }
                if (isset($existing[$date])) { $result['skipped_existing']++; continue; }
                if ($leaves->contains(fn ($leave) => $leave->start_date->toDateString() <= $date && $leave->end_date->toDateString() >= $date)) {
                    $result['skipped_leave']++; continue;
                }
                HrRoster::create([
                    'employee_id' => $data['employee_id'], 'shift_id' => $shift->id,
                    'work_date' => $date, 'status' => 'scheduled',
                    'planned_start' => substr($shift->start_time, 0, 5),
                    'planned_end' => substr($shift->end_time, 0, 5),
                    'notes' => $data['notes'] ?? null,
                ]);
                $result['created']++;
            }
            return $result;
        });
        return response()->json($counts, 201);
    }

    public function update(Request $request, HrRoster $roster)
    {
        $data = $this->data($request, true);
        $this->checkLeave($roster->employee_id, $roster->work_date->toDateString(), $data['status']);
        $roster->update($data);
        return response()->json($roster->fresh(['employee', 'shift']));
    }

    public function destroy(HrRoster $roster)
    {
        $roster->delete();
        return response()->json(['success' => true]);
    }

    private function checkLeave(int $employeeId, string $day, string $status): void
    {
        if ($status !== 'scheduled') return;
        if (HrLeaveRequest::where('employee_id', $employeeId)->where('status', 'approved')
            ->whereDate('start_date', '<=', $day)->whereDate('end_date', '>=', $day)->exists())
            throw ValidationException::withMessages(['work_date' => ['الموظف في إجازة معتمدة لهذا اليوم؛ ألغِ الإجازة قبل جدولة وردية.']]);
    }

    private function data(Request $request, bool $updating = false): array
    {
        $rules = [
            'shift_id' => 'nullable|integer|exists:hr_shifts,id',
            'planned_start' => 'nullable|date_format:H:i', 'planned_end' => 'nullable|date_format:H:i',
            'status' => 'required|in:scheduled,day_off,leave,holiday,cancelled',
            'notes' => 'nullable|string|max:1000',
        ];
        if (!$updating) {
            $rules['employee_id'] = 'required|integer|exists:hr_employees,id';
            $rules['work_date'] = 'required|date_format:Y-m-d';
        }
        $data = $request->validate($rules);
        if ($data['status'] === 'scheduled' && empty($data['shift_id']))
            throw ValidationException::withMessages(['shift_id' => ['اختر الوردية لليوم المجدول.']]);
        if ($data['status'] !== 'scheduled') {
            $data['shift_id'] = null;
            $data['planned_start'] = null;
            $data['planned_end'] = null;
        }
        return $data;
    }
}
