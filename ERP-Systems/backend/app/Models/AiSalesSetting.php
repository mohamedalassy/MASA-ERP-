<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesSetting extends Model {protected $fillable=['key','value','group','tenant_key'];protected $casts=['value'=>'array'];}
