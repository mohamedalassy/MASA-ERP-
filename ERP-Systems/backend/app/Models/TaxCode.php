<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class TaxCode extends Model {protected $fillable=['code','name','rate','category','exemption_reason_code','exemption_reason','is_active'];protected $casts=['rate'=>'decimal:4','is_active'=>'boolean'];}