<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesCompetitor extends Model{protected $fillable=['name','website','industry','strengths','weaknesses','products','notes'];protected $casts=['strengths'=>'array','weaknesses'=>'array','products'=>'array'];}