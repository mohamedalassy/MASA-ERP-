<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrLearningCourse extends Model { protected $fillable=['code','title','provider','delivery','cost','duration_hours','skills','is_active']; protected $casts=['skills'=>'array','is_active'=>'boolean']; }
