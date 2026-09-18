<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesIntegrationSource extends Model {protected $fillable=['name','driver','status','config','capabilities','last_sync_at','last_error','is_active'];protected $casts=['config'=>'encrypted:array','capabilities'=>'array','last_sync_at'=>'datetime','is_active'=>'boolean'];}