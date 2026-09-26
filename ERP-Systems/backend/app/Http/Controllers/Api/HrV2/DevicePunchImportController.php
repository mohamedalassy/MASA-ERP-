<?php

namespace App\Http\Controllers\Api\HrV2;

use App\Http\Controllers\Controller;
use App\Models\HrAttendanceDevice;
use App\Models\HrAttendanceEvent;
use App\Models\HrAttendanceLog;
use App\Models\HrDeviceSyncLog;
use App\Models\HrEmployee;
use App\Models\HrRoster;
use App\Services\Hr\AttendanceProcessor;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DevicePunchImportController extends Controller
{
    public function logs(Request $request, HrAttendanceDevice $device)
    {
        return response()->json(HrAttendanceLog::with('employee:id,employee_number,first_name,last_name')
            ->where('device_id', $device->id)
            ->orderByDesc('punched_at')
            ->paginate(min(100, max(1, $request->integer('per_page', 30)))));
    }

    public function mapEmployee(Request $request, HrAttendanceDevice $device, HrEmployee $employee)
    {
        $data = $request->validate([
            'biometric_user_id' => ['required', 'string', 'max:60'],
        ]);
        $userId = trim($data['biometric_user_id']);
        $conflict = DB::table('hr_device_employee_mappings')
            ->where('device_id', $device->id)->where('biometric_user_id', $userId)
            ->where('employee_id', '!=', $employee->id)->exists();
        if ($conflict) return response()->json(['message' => 'رقم البصمة مرتبط بموظف آخر على هذا الجهاز.'], 422);
        DB::table('hr_device_employee_mappings')->updateOrInsert(
            ['device_id' => $device->id, 'employee_id' => $employee->id],
            ['biometric_user_id' => $userId, 'updated_at' => now(), 'created_at' => now()]
        );
        return response()->json(['success' => true, 'data' => [
            'device_id' => $device->id, 'employee_id' => $employee->id, 'biometric_user_id' => $userId,
        ]]);
    }

    public function import(Request $request, HrAttendanceDevice $device, AttendanceProcessor $processor)
    {
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:2048']]);
        abort_unless($device->is_active, 422, 'الجهاز معطل.');
        $handle = fopen($request->file('file')->getRealPath(), 'rb');
        if (!$handle) {
            return response()->json(['message' => 'تعذر فتح الملف.'], 422);
        }

        // Unified CSV: biometric_user_id,event_at,event_type,event_uid
        $header = fgetcsv($handle);
        $header = array_map(fn ($value) => trim((string) $value), $header ?: []);
        if (isset($header[0])) $header[0] = ltrim($header[0], "\xEF\xBB\xBF");
        if (count($header) !== count(array_unique($header)) ||
            array_diff(['biometric_user_id', 'event_at', 'event_type', 'event_uid'], $header)) {
            fclose($handle);
            return response()->json(['message' => 'الأعمدة المطلوبة: biometric_user_id,event_at,event_type,event_uid'], 422);
        }

        $sync = HrDeviceSyncLog::create([
            'attendance_device_id' => $device->id, 'direction' => 'pull',
            'status' => 'success', 'started_at' => now(),
        ]);
        $received = $created = $failed = $duplicates = 0;
        $errors = [];
        $lineNumber = 1;
        try {
            while (($values = fgetcsv($handle)) !== false) {
                ++$lineNumber;
                if ($values === [null]) continue;
                ++$received;
                if ($received > 5000) {
                    ++$failed;
                    $errors[] = "السطر {$lineNumber}: الحد الأقصى 5000 سجل للملف.";
                    break;
                }
                if (count($values) !== count($header)) {
                    ++$failed;
                    $errors[] = "السطر {$lineNumber}: عدد الأعمدة غير صحيح.";
                    continue;
                }
                $row = array_combine($header, $values);
                $userId = trim((string) $row['biometric_user_id']);
                $uid = trim((string) $row['event_uid']);
                $type = trim((string) $row['event_type']);
                if (!$userId || !$uid || strlen($uid) > 100 ||
                    !in_array($type, ['check_in', 'check_out'], true) ||
                    !preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', trim((string) $row['event_at']))) {
                    ++$failed;
                    $errors[] = "السطر {$lineNumber}: بيانات البصمة غير صالحة.";
                    continue;
                }
                try {
                    $time = Carbon::createFromFormat('!Y-m-d H:i:s', trim($row['event_at']), $device->timezone);
                    if (!$time || $time->format('Y-m-d H:i:s') !== trim($row['event_at'])) {
                        throw new \InvalidArgumentException('تاريخ أو وقت غير صالح.');
                    }
                    $time = $time->setTimezone(config('app.timezone'));
                    $uniqueId = "{$device->id}:{$uid}";
                    $existing = HrAttendanceLog::where('event_uid', $uniqueId)->first();
                    if ($existing && $existing->processing_status === 'processed') {
                        ++$duplicates;
                        continue;
                    }
                    if ($existing && ($existing->device_id !== $device->id ||
                        $existing->biometric_user_id !== $userId ||
                        $existing->punch_type !== $type ||
                        !$existing->punched_at->equalTo($time))) {
                        ++$failed;
                        $errors[] = "السطر {$lineNumber}: معرّف الحركة مستخدم لبيانات مختلفة.";
                        continue;
                    }
                    $mapping = DB::table('hr_device_employee_mappings')
                        ->where('device_id', $device->id)->where('biometric_user_id', $userId)->first();
                    $employee = $mapping ? HrEmployee::find($mapping->employee_id) : null;
                    if (!$employee) {
                        HrAttendanceLog::firstOrCreate(['event_uid' => $uniqueId], [
                            'device_id' => $device->id, 'biometric_user_id' => $userId,
                            'punched_at' => $time, 'punch_type' => $type,
                            'processing_status' => 'error',
                            'error_message' => 'رقم البصمة غير مربوط بموظف على هذا الجهاز.',
                        ]);
                        ++$failed;
                        $errors[] = "السطر {$lineNumber}: رقم البصمة {$userId} غير مربوط بموظف على هذا الجهاز.";
                        continue;
                    }
                    DB::transaction(function () use ($device, $employee, $userId, $uniqueId, $time, $type, $processor, $request, $existing) {
                        $fields = [
                            'device_id' => $device->id, 'employee_id' => $employee->id,
                            'biometric_user_id' => $userId, 'event_uid' => $uniqueId,
                            'punched_at' => $time, 'punch_type' => $type,
                            'direction' => $type === 'check_in' ? 'in' : 'out',
                            'processing_status' => 'processed', 'processed_at' => now(), 'error_message' => null,
                        ];
                        if ($existing) $existing->update($fields);
                        else HrAttendanceLog::create($fields);
                        HrAttendanceEvent::create([
                            'employee_id' => $employee->id, 'attendance_device_id' => $device->id,
                            'event_type' => $type, 'event_at' => $time, 'source' => 'device',
                            'external_event_id' => $uniqueId,
                        ]);
                        $date = $time->toDateString();
                        $nightCheckout = false;
                        if ($type === 'check_out') {
                            $yesterday = $time->copy()->subDay()->toDateString();
                            $previousShift = HrRoster::with('shift')
                                ->where('employee_id', $employee->id)->whereDate('work_date', $yesterday)
                                ->first()?->shift ?? $employee->shift;
                            // Early morning checkout belongs to yesterday's night shift.
                            $nightCheckout = $previousShift?->crosses_midnight && $time->hour < 12;
                            if ($nightCheckout) {
                                $processor->rebuildDay($employee, $yesterday, $request->user()?->id);
                            }
                        }
                        if (!$nightCheckout) {
                            $processor->rebuildDay($employee, $date, $request->user()?->id);
                        }
                    });
                    ++$created;
                } catch (\Throwable $exception) {
                    ++$failed;
                    $errors[] = "السطر {$lineNumber}: " . $exception->getMessage();
                }
            }
        } finally {
            fclose($handle);
            $sync->update([
                'status' => $failed ? ($created ? 'partial' : 'failed') : 'success',
                'records_received' => $received, 'records_created' => $created,
                'records_failed' => $failed, 'finished_at' => now(),
                'message' => "المكرر: {$duplicates}",
                'meta' => ['errors' => array_slice($errors, 0, 50)],
            ]);
            $device->update(['last_sync_at' => now()]);
        }
        return response()->json(['success' => !$failed, 'data' => [
            'received' => $received, 'created' => $created,
            'duplicates' => $duplicates, 'failed' => $failed,
            'errors' => array_slice($errors, 0, 50),
        ]], $failed ? 207 : 200);
    }
}
