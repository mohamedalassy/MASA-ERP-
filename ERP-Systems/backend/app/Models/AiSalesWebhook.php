<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesWebhook extends Model{protected $fillable=['name', 'url', 'events', 'secret', 'is_active', 'last_delivery_at', 'last_status'];protected $casts=['events'=>'array'];}