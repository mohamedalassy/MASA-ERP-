<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrLegalEntity extends Model { protected $fillable=['code','name','name_en','commercial_registration','unified_number','tax_number','country','is_active','settings']; protected $casts=['is_active'=>'boolean','settings'=>'array']; public function branches(){return $this->hasMany(HrBranch::class,'legal_entity_id');} }
