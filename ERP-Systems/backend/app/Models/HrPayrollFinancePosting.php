<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrPayrollFinancePosting extends Model { protected $fillable=['payroll_run_id','posting_reference','status','journal_entry_id','error_message','posted_at','snapshot']; protected $casts=['posted_at'=>'datetime','snapshot'=>'array']; }
