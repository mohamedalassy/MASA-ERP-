<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrSkill extends Model { protected $fillable=['code','name','category','description','is_active']; protected $casts=['is_active'=>'boolean']; }
