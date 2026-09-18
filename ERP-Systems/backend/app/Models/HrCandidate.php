<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrCandidate extends Model { protected $fillable=['candidate_number','first_name','last_name','email','mobile','nationality','city','current_title','years_experience','source','cv_path','skills','status','meta']; protected $casts=['skills'=>'array','meta'=>'array']; public function applications(){return $this->hasMany(HrApplication::class,'candidate_id');} }
