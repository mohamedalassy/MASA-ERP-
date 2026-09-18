<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGovernmentConnector extends Model { protected $fillable=['code','name','channel','status','last_sync_at','last_success_at','last_error','settings','is_active']; protected $casts=['settings'=>'array','is_active'=>'boolean','last_sync_at'=>'datetime','last_success_at'=>'datetime']; public function transactions(){return $this->hasMany(HrGovernmentTransaction::class,'connector_id');} }
