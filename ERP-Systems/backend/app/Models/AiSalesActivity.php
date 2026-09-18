<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesActivity extends Model {protected $fillable=['event','subject_type','subject_id','company_id','user_id','description','before','after','metadata'];protected $casts=['before'=>'array','after'=>'array','metadata'=>'array'];}