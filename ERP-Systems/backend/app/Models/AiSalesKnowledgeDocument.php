<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesKnowledgeDocument extends Model{protected $fillable=['title', 'source_type', 'source_ref', 'content', 'metadata', 'is_active'];protected $casts=['metadata'=>'array'];}