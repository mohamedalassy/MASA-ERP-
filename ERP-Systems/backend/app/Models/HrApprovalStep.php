<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrApprovalStep extends Model { protected $fillable=['approval_request_id','step_number','approver_type','approver_id','status','comment','acted_at']; protected $casts=['acted_at'=>'datetime']; }
