<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesConsent extends Model{protected $table='ai_sales_consent';protected $fillable=['company_id', 'contact_id', 'channel', 'status', 'changed_at', 'reason'];}