<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAutomationRule extends Model { protected $fillable=['code','name','trigger_event','conditions','actions','is_active','execution_order']; protected $casts=['conditions'=>'array','actions'=>'array','is_active'=>'boolean']; }
