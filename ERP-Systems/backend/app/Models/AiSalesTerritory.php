<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesTerritory extends Model {protected $fillable=['name','country','region','cities','industries','owner_id','target_value','is_active'];protected $casts=['cities'=>'array','industries'=>'array','target_value'=>'decimal:2','is_active'=>'boolean'];}