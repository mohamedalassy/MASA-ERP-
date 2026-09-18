<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesTarget extends Model{protected $fillable=['scope_type', 'scope_id', 'metric', 'target_value', 'period_start', 'period_end'];}