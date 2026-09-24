<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class GosiRateSchedule extends Model {
 protected $fillable=['scheme','effective_from','effective_to','pension_employee','pension_employer','hazards_employer','saned_employee','saned_employer','wage_ceiling','is_active','notes'];
 protected $casts=['effective_from'=>'date','effective_to'=>'date','pension_employee'=>'decimal:4','pension_employer'=>'decimal:4','hazards_employer'=>'decimal:4','saned_employee'=>'decimal:4','saned_employer'=>'decimal:4','wage_ceiling'=>'decimal:2','is_active'=>'boolean'];
}
