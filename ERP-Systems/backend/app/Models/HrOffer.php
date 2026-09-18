<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrOffer extends Model { protected $fillable=['application_id','offer_number','basic_salary','allowances','currency','proposed_start_date','status','sent_at','responded_at','expires_at']; protected $casts=['allowances'=>'array','proposed_start_date'=>'date','sent_at'=>'datetime','responded_at'=>'datetime','expires_at'=>'date']; }
