<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrEmployeeAcknowledgement extends Model { protected $fillable=['employee_id','document_type','document_reference','acknowledged_at','ip_address','meta']; protected $casts=['acknowledged_at'=>'datetime','meta'=>'array']; }
