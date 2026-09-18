<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSalaryComponent extends Model { protected $fillable=['code','name','type','calculation_type','default_value','formula','taxable','gosi_applicable','is_active','settings']; protected $casts=['taxable'=>'boolean','gosi_applicable'=>'boolean','is_active'=>'boolean','settings'=>'array']; }
