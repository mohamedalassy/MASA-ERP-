<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesGovernanceEvent extends Model{protected $table='ai_sales_governance_events';protected $fillable=['action', 'status', 'actor_type', 'user_id', 'input', 'output', 'reason'];protected $casts=['input'=>'array','output'=>'array'];}