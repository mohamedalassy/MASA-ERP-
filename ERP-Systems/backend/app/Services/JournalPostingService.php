<?php
namespace App\Services;
use App\Models\FinanceAccount;
use App\Models\FinanceJournalEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
class JournalPostingService {
 public function requireAccount(string $code,string $label):FinanceAccount {
  $a=FinanceAccount::query()->where('code',$code)->where('is_active',true)->where('is_postable',true)->first();
  if(!$a)throw ValidationException::withMessages(['account'=>["الحساب {$code} ({$label}) غير موجود أو غير قابل للترحيل."]]);return $a;
 }
 public function post(array $reference,array $lines,string $description,string $entryDate,?int $userId=null,?string $notes=null):FinanceJournalEntry {
  $d=round(collect($lines)->sum(fn($x)=>(float)($x['debit']??0)),2);$c=round(collect($lines)->sum(fn($x)=>(float)($x['credit']??0)),2);
  if($d<=0||abs($d-$c)>0.01)throw ValidationException::withMessages(['journal'=>["قيد الرواتب غير متوازن. مدين: {$d} / دائن: {$c}"]]);
  $old=FinanceJournalEntry::query()->where('reference_type',$reference['type'])->where('reference_id',$reference['id'])->first();
  if($old){if($old->status==='posted')return $old;throw ValidationException::withMessages(['journal'=>['يوجد قيد محاسبي سابق لنفس تشغيل الرواتب.']]);}
  return DB::transaction(function()use($reference,$lines,$description,$entryDate,$userId,$notes,$d,$c){
   $e=FinanceJournalEntry::create(['entry_number'=>$this->nextJournalNumber(),'entry_date'=>$entryDate,'description'=>$description,'reference_type'=>$reference['type'],'reference_id'=>$reference['id'],'reference_number'=>$reference['number']??null,'status'=>'posted','total_debit'=>$d,'total_credit'=>$c,'created_by'=>$userId,'approved_by'=>$userId,'approved_at'=>now(),'posted_by'=>$userId,'posted_at'=>now(),'notes'=>$notes]);
   foreach($lines as $x)$e->lines()->create(['account_id'=>$x['account_id'],'cost_center_id'=>$x['cost_center_id']??null,'project_id'=>$x['project_id']??null,'description'=>$x['description']??null,'debit'=>round((float)($x['debit']??0),2),'credit'=>round((float)($x['credit']??0),2)]);
   return $e->fresh('lines');
  });
 }
 private function nextJournalNumber():string {
  $p='JE-'.now()->format('Y').'-';$last=FinanceJournalEntry::query()->where('entry_number','like',$p.'%')->orderByDesc('id')->value('entry_number');$n=1;
  if($last&&preg_match('/(\d+)$/',$last,$m))$n=((int)$m[1])+1;return $p.str_pad((string)$n,5,'0',STR_PAD_LEFT);
 }
}
