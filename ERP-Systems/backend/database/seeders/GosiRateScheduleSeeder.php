<?php
namespace Database\Seeders;
use App\Models\GosiRateSchedule;use Illuminate\Database\Seeder;
class GosiRateScheduleSeeder extends Seeder{
 public function run():void{
  $rows=[
   ['scheme'=>'existing','effective_from'=>'2022-01-01','effective_to'=>null,'pension_employee'=>9,'pension_employer'=>9,'hazards_employer'=>2,'saned_employee'=>0.75,'saned_employer'=>0.75,'wage_ceiling'=>45000,'notes'=>'Existing Saudi scheme. GOSI: pension 9% each; occupational hazards 2% employer; SANED 0.75% each.'],
   ['scheme'=>'new','effective_from'=>'2024-07-03','effective_to'=>'2025-07-02','pension_employee'=>9,'pension_employer'=>9,'hazards_employer'=>2,'saned_employee'=>0.75,'saned_employer'=>0.75,'wage_ceiling'=>45000,'notes'=>'New system year 1.'],
   ['scheme'=>'new','effective_from'=>'2025-07-03','effective_to'=>'2026-07-02','pension_employee'=>9.5,'pension_employer'=>9.5,'hazards_employer'=>2,'saned_employee'=>0.75,'saned_employer'=>0.75,'wage_ceiling'=>45000,'notes'=>'New system year 2: pension +0.5pp each.'],
   ['scheme'=>'new','effective_from'=>'2026-07-03','effective_to'=>'2027-07-02','pension_employee'=>10,'pension_employer'=>10,'hazards_employer'=>2,'saned_employee'=>0.75,'saned_employer'=>0.75,'wage_ceiling'=>45000,'notes'=>'New system year 3: pension 10% each.'],
   ['scheme'=>'new','effective_from'=>'2027-07-03','effective_to'=>'2028-07-02','pension_employee'=>10.5,'pension_employer'=>10.5,'hazards_employer'=>2,'saned_employee'=>0.75,'saned_employer'=>0.75,'wage_ceiling'=>45000,'notes'=>'New system year 4.'],
   ['scheme'=>'new','effective_from'=>'2028-07-03','effective_to'=>null,'pension_employee'=>11,'pension_employer'=>11,'hazards_employer'=>2,'saned_employee'=>0.75,'saned_employer'=>0.75,'wage_ceiling'=>45000,'notes'=>'New system year 5 onward.'],
   ['scheme'=>'expat','effective_from'=>'2024-07-03','effective_to'=>null,'pension_employee'=>0,'pension_employer'=>0,'hazards_employer'=>2,'saned_employee'=>0,'saned_employer'=>0,'wage_ceiling'=>45000,'notes'=>'Occupational hazards only; verify employee-specific applicability before production.'],
  ];
  foreach($rows as $r)GosiRateSchedule::updateOrCreate(['scheme'=>$r['scheme'],'effective_from'=>$r['effective_from']],$r);
 }
}