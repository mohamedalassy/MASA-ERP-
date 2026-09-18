<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrOnboardingTemplateTask extends Model { protected $fillable=['template_id','title','owner_type','due_offset_days','required','automation','sort_order']; protected $casts=['required'=>'boolean','automation'=>'array']; }
