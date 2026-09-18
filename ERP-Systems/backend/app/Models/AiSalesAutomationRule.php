<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesAutomationRule extends Model {protected $fillable=['name','trigger','conditions','actions','is_active','run_count','last_run_at'];protected $casts=['conditions'=>'array','actions'=>'array','is_active'=>'boolean','last_run_at'=>'datetime'];}