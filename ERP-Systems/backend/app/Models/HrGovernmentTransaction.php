<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGovernmentTransaction extends Model { protected $fillable=['connector_id','employee_id','transaction_type','external_reference','status','request_payload','response_payload','error_message','submitted_at','completed_at']; protected $casts=['request_payload'=>'array','response_payload'=>'array']; public function connector(){return $this->belongsTo(HrGovernmentConnector::class,'connector_id');} }
