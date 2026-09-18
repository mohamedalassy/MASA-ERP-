<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrComplianceRule extends Model { protected $fillable=['code','name','category','severity','configuration','is_active']; protected $casts=['configuration'=>'array','is_active'=>'boolean']; }
