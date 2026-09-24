<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void {
  if(!Schema::hasTable('gosi_rate_schedules'))Schema::create('gosi_rate_schedules',function(Blueprint $t){$t->id();$t->string('scheme',20);$t->date('effective_from');$t->date('effective_to')->nullable();$t->decimal('pension_employee',8,4)->default(0);$t->decimal('pension_employer',8,4)->default(0);$t->decimal('hazards_employer',8,4)->default(0);$t->decimal('saned_employee',8,4)->default(0);$t->decimal('saned_employer',8,4)->default(0);$t->decimal('wage_ceiling',15,2)->default(45000);$t->boolean('is_active')->default(true);$t->text('notes')->nullable();$t->timestamps();$t->index(['scheme','effective_from']);});
  if(!Schema::hasTable('hr_payrolls'))return;
  $add=function($c,$fn){if(!Schema::hasColumn('hr_payrolls',$c))Schema::table('hr_payrolls',fn(Blueprint $t)=>$fn($t));};
  $add('period_year',fn($t)=>$t->unsignedSmallInteger('period_year')->nullable());$add('period_month',fn($t)=>$t->unsignedTinyInteger('period_month')->nullable());
  foreach(['housing_allowance','transport_allowance','other_allowances','absence_deduction','late_deduction','loan_deduction','gosi_deduction'] as $c)$add($c,fn($t)=>$t->decimal($c,15,2)->default(0));
  $add('overtime_hours',fn($t)=>$t->decimal('overtime_hours',10,2)->default(0));$add('worked_days',fn($t)=>$t->decimal('worked_days',10,2)->default(0));
  DB::table('hr_payrolls')->whereNull('period_year')->update(['period_year'=>DB::raw('year')]);DB::table('hr_payrolls')->whereNull('period_month')->update(['period_month'=>DB::raw('month')]);
 }
 public function down():void {}
};
