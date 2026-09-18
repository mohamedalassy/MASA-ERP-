<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesDealRoom extends Model{protected $fillable=['opportunity_id', 'stakeholders', 'documents', 'objections', 'commitments', 'strategy'];protected $casts=['stakeholders'=>'array','documents'=>'array','objections'=>'array','commitments'=>'array'];}