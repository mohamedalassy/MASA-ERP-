<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrErpIntegrationEvent extends Model { protected $fillable=['event_type','source_module','target_module','employee_id','reference_type','reference_id','status','payload','attempts','last_error','processed_at']; protected $casts=['payload'=>'array','processed_at'=>'datetime']; }
