<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class AiSalesPlaybook extends Model { protected $fillable=['name','trigger_type','description','steps','is_active']; protected $casts=['steps'=>'array','is_active'=>'boolean'];}