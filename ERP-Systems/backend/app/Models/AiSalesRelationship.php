<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesRelationship extends Model{protected $fillable=['from_type','from_id','to_type','to_id','relationship_type','strength','metadata'];protected $casts=['metadata'=>'array'];}