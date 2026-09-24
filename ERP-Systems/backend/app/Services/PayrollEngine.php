<?php

namespace App\Services;

use App\Models\HrEmployee;
use App\Models\HrPayroll;
use App\Models\HrPayrollRun;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class PayrollEngine
{
    private const SALARY_EXPENSE = '5210';
    private const GOSI_EXPENSE = '5230';
    private const EOSB_EXPENSE = '5240';
    private const SALARY_PAYABLE = '2130';
    private const GOSI_PAYABLE = '2150';
    private const EOSB_PROVISION = '2220';

    public function __construct(
        private readonly GosiCalculator $gosi,
        private readonly EosbCalculator $eosb,
        private readonly JournalPostingService $posting,
        private readonly DocumentNumberService $sequences
    ) {}

    public function run(int $year,int $month,?int $branchId=null,?int $userId=null):HrPayrollRun
    {
        $existing=HrPayrollRun::query()->where('period_year',$year)->where('period_month',$month)
            ->where(function($q)use($branchId){$branchId===null?$q->whereNull('branch_id'):$q->where('branch_id',$branchId);})->first();

        if($existing && $existing->status!=='draft'){
            throw ValidationException::withMessages(['period'=>['تشغيل رواتب الفترة موجود بحالة: '.$existing->status]]);
        }

        $employees=HrEmployee::query()->with('department')->whereIn('status',['active','on_leave'])
            ->where('is_active',true)->when($branchId,fn($q)=>$q->where('branch_id',$branchId))->get();

        if($employees->isEmpty()) throw ValidationException::withMessages(['employees'=>['لا يوجد موظفون نشطون في الفترة.']]);

        return DB::transaction(function()use($existing,$year,$month,$branchId,$employees,$userId){
            $run=$existing?:HrPayrollRun::create([
                'run_number'=>$this->sequences->next('payroll_run','PR'),
                'period_year'=>$year,'period_month'=>$month,'branch_id'=>$branchId,'status'=>'draft','created_by'=>$userId
            ]);

            DB::table('hr_payrolls')->where('payroll_run_id',$run->id)->delete();
            $tot=['gross'=>0,'deductions'=>0,'net'=>0,'gosi_employee'=>0,'gosi_employer'=>0,'eosb'=>0];
            $count=0;

            foreach($employees as $employee){
                $contract=$this->activeContract($employee,$year,$month);
                if(!$contract)continue;
                $row=$this->calculateEmployee($run,$employee,$contract,$year,$month);
                $count++;
                $tot['gross']+=(float)$row->gross_salary;
                $tot['deductions']+=(float)$row->total_deductions;
                $tot['net']+=(float)$row->net_salary;
                $tot['gosi_employee']+=(float)$row->gosi_deduction;
                $tot['gosi_employer']+=(float)$row->gosi_employer;
                $tot['eosb']+=(float)$row->eosb_accrual;
            }

            if(!$count)throw ValidationException::withMessages(['contracts'=>['لا يوجد موظف بعقد ساري في الفترة.']]);

            $run->update([
                'status'=>'calculated','employees_count'=>$count,
                'total_gross'=>round($tot['gross'],2),'total_deductions'=>round($tot['deductions'],2),
                'total_gosi_employee'=>round($tot['gosi_employee'],2),'total_gosi_employer'=>round($tot['gosi_employer'],2),
                'total_net'=>round($tot['net'],2),'total_eosb_accrual'=>round($tot['eosb'],2)
            ]);
            return $run->fresh();
        });
    }

    private function calculateEmployee(HrPayrollRun $run,HrEmployee $employee,$contract,int $year,int $month):HrPayroll
    {
        $basic=(float)$contract->basic_salary;
        $housing=(float)$contract->housing_allowance;
        $transport=(float)$contract->transport_allowance;
        $other=(float)$contract->other_allowances;
        $monthlyWage=round($basic+$housing+$transport+$other,2);
        $dailyWage=round($monthlyWage/30,4);
        $attendance=$this->attendanceSummary($employee->id,$year,$month);
        $hoursPerDay=$this->dailyHours($employee);
        $hourly=round($basic/30/$hoursPerDay,4);
        $ot=round($attendance['overtime_hours']*$hourly*1.5,2);
        $absence=round($attendance['absence_days']*$dailyWage,2);
        $late=round($attendance['late_minutes']*($hourly/60),2);
        $unpaid=round($attendance['unpaid_leave_days']*$dailyWage,2);
        $gross=round($monthlyWage+$ot,2);
        $gosi=$this->gosi->calculate($employee,$basic,$housing,Carbon::create($year,$month)->endOfMonth()->toDateString());
        $deductions=round($absence+$late+$unpaid+$gosi['employee'],2);

        return HrPayroll::create([
            HrFieldResolver::employeeKey('hr_payrolls')=>$employee->id,
            'payroll_run_id'=>$run->id,'year'=>$year,'month'=>$month,'period_year'=>$year,'period_month'=>$month,
            'period_start'=>Carbon::create($year,$month,1)->toDateString(),'period_end'=>Carbon::create($year,$month,1)->endOfMonth()->toDateString(),
            'basic_salary'=>$basic,'allowances'=>$housing+$transport+$other,'housing_allowance'=>$housing,
            'transport_allowance'=>$transport,'other_allowances'=>$other,'overtime_hours'=>$attendance['overtime_hours'],
            'overtime_amount'=>$ot,'absent_days'=>$attendance['absence_days'],'worked_days'=>$attendance['worked_days'],
            'absence_deduction'=>$absence,'absence_deductions'=>$absence,'late_deduction'=>$late,'late_deductions'=>$late,
            'other_deductions'=>$unpaid,'loan_deduction'=>0,'loans_deductions'=>0,'gosi_deduction'=>$gosi['employee'],
            'gosi_employer'=>$gosi['employer'],'gosi_base'=>$gosi['base'],'gosi_scheme'=>$gosi['scheme'],
            'gross_salary'=>$gross,'total_deductions'=>$deductions,'net_salary'=>max(0,round($gross-$deductions,2)),
            'eosb_accrual'=>$this->eosb->monthlyAccrual($employee,$monthlyWage),
            'cost_center_id'=>$this->costCenterId($employee),
            'project_allocations'=>$this->projectAllocations($employee->user_id,$monthlyWage,$year,$month),
            'status'=>'draft'
        ]);
    }

    private function attendanceSummary(int $employeeId,int $year,int $month):array
    {
        $start=Carbon::create($year,$month,1)->toDateString();$end=Carbon::create($year,$month,1)->endOfMonth()->toDateString();
        $date=HrFieldResolver::attendanceDateColumn();$key=HrFieldResolver::employeeKey('hr_attendance_daily');
        $row=DB::table('hr_attendance_daily')->where($key,$employeeId)->whereBetween($date,[$start,$end])
            ->selectRaw("COALESCE(SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END),0) absence_days,
            COALESCE(SUM(CASE WHEN status IN ('present','late','early_leave') THEN 1 ELSE 0 END),0) worked_days,
            COALESCE(SUM(late_minutes),0) late_minutes,COALESCE(SUM(overtime_minutes),0) overtime_minutes")->first();
        $unpaid=0.0;
        if(Schema::hasTable('hr_leave_requests')&&Schema::hasTable('hr_leave_types')){
            $leaveKey=HrFieldResolver::employeeKey('hr_leave_requests');
            $unpaid=(float)DB::table('hr_leave_requests as r')->join('hr_leave_types as t','t.id','=','r.leave_type_id')
                ->where("r.$leaveKey",$employeeId)->where('r.status','approved')->where('t.is_paid',false)
                ->where(function($q)use($start,$end){$q->whereBetween('r.start_date',[$start,$end])->orWhereBetween('r.end_date',[$start,$end]);})
                ->sum('r.days_count');
        }
        return ['absence_days'=>(float)($row->absence_days??0),'worked_days'=>(float)($row->worked_days??0),
            'late_minutes'=>(float)($row->late_minutes??0),'overtime_hours'=>round((float)($row->overtime_minutes??0)/60,2),
            'unpaid_leave_days'=>$unpaid];
    }

    private function dailyHours(HrEmployee $employee):float
    {
        if(!$employee->shift_id)return 8.0;
        $minutes=DB::table('hr_shifts')->where('id',$employee->shift_id)->value(HrFieldResolver::shiftMinutesColumn());
        return $minutes>0?round($minutes/60,2):8.0;
    }

    private function costCenterId(HrEmployee $employee):?int
    {
        $d=$employee->department;if(!$d)return null;
        if(!empty($d->cost_center_id))return (int)$d->cost_center_id;
        return !empty($d->cost_center_code)?DB::table('cost_centers')->where('code',$d->cost_center_code)->value('id'):null;
    }

    private function projectAllocations(?int $userId,float $monthlyWage,int $year,int $month):?array
    {
        if(!$userId||!Schema::hasTable('project_site_checkins'))return null;
        $start=Carbon::create($year,$month,1);$end=$start->copy()->endOfMonth();
        $rows=DB::table('project_site_checkins')->where('user_id',$userId)->whereNotNull('checked_out_at')
            ->whereBetween('checked_in_at',[$start,$end])->groupBy('project_id')
            ->selectRaw('project_id, SUM(duration_minutes) minutes')->get();
        $total=(float)$rows->sum('minutes');if($total<=0)return null;$costPerMinute=$monthlyWage/(8*60*22);
        return $rows->map(fn($r)=>['project_id'=>(int)$r->project_id,'minutes'=>(int)$r->minutes,
            'hours'=>round($r->minutes/60,2),'cost'=>round($r->minutes*$costPerMinute,2),
            'share_percent'=>round(($r->minutes/$total)*100,2)])->all();
    }

    private function activeContract(HrEmployee $employee,int $year,int $month)
    {
        $end=Carbon::create($year,$month,1)->endOfMonth();$key=HrFieldResolver::employeeKey('hr_employee_contracts');
        return DB::table('hr_employee_contracts')->where($key,$employee->id)->where('status','active')
            ->where('start_date','<=',$end->toDateString())->where(fn($q)=>$q->whereNull('end_date')->orWhere('end_date','>=',$end->copy()->startOfMonth()->toDateString()))
            ->orderByDesc('start_date')->first();
    }

    public function post(HrPayrollRun $run,?int $userId=null):HrPayrollRun
    {
        if($run->status!=='approved')throw ValidationException::withMessages(['status'=>['يجب اعتماد تشغيل الرواتب قبل الترحيل.']]);
        $salary=$this->posting->requireAccount(self::SALARY_EXPENSE,'الرواتب والأجور');
        $gosiExp=$this->posting->requireAccount(self::GOSI_EXPENSE,'مصروف التأمينات');
        $salaryPay=$this->posting->requireAccount(self::SALARY_PAYABLE,'رواتب مستحقة');
        $gosiPay=$this->posting->requireAccount(self::GOSI_PAYABLE,'التأمينات المستحقة');
        $eosbProvision=$this->posting->requireAccount(self::EOSB_PROVISION,'مخصص نهاية الخدمة');
        $eosbExpense=(float)$run->total_eosb_accrual>0?$this->posting->requireAccount(self::EOSB_EXPENSE,'مصروف نهاية الخدمة'):null;
        $lines=[];
        foreach(DB::table('hr_payrolls')->where('payroll_run_id',$run->id)->groupBy('cost_center_id')->selectRaw('cost_center_id,SUM(gross_salary) amount')->get() as $g){
            if((float)$g->amount>0)$lines[]=['account_id'=>$salary->id,'debit'=>round((float)$g->amount,2),'credit'=>0,'cost_center_id'=>$g->cost_center_id?:null,'description'=>'مصروف رواتب الفترة'];
        }
        $ge=round((float)$run->total_gosi_employer,2);$gp=round((float)$run->total_gosi_employee,2);$eo=round((float)$run->total_eosb_accrual,2);
        if($ge>0)$lines[]=['account_id'=>$gosiExp->id,'debit'=>$ge,'credit'=>0,'description'=>'حصة الشركة في التأمينات'];
        if($eo>0){$lines[]=['account_id'=>$eosbExpense->id,'debit'=>$eo,'credit'=>0,'description'=>'مصروف نهاية الخدمة'];
            $lines[]=['account_id'=>$eosbProvision->id,'debit'=>0,'credit'=>$eo,'description'=>'مخصص نهاية الخدمة'];}
        $lines[]=['account_id'=>$salaryPay->id,'debit'=>0,'credit'=>round((float)$run->total_net,2),'description'=>'صافي الرواتب المستحقة'];
        if($ge+$gp>0)$lines[]=['account_id'=>$gosiPay->id,'debit'=>0,'credit'=>round($ge+$gp,2),'description'=>'التأمينات المستحقة'];
        return DB::transaction(function()use($run,$lines,$userId){
            $entry=$this->posting->post(['type'=>'payroll_run','id'=>$run->id,'number'=>$run->run_number],$lines,
                sprintf('قيد رواتب شهر %02d/%d',$run->period_month,$run->period_year),
                Carbon::create($run->period_year,$run->period_month)->endOfMonth()->toDateString(),$userId,'قيد آلي من تشغيل الرواتب.');
            $run->update(['status'=>'posted','finance_journal_entry_id'=>$entry->id,'posted_at'=>now()]);
            DB::table('hr_payrolls')->where('payroll_run_id',$run->id)->update(['status'=>'posted']);
            return $run->fresh();
        });
    }
}
