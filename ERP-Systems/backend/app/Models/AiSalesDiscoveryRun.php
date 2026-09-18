<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesDiscoveryRun extends Model { protected $fillable=['status','criteria','found_count','accepted_count','rejected_count','notes','started_at','finished_at']; protected $casts=['criteria'=>'array','started_at'=>'datetime','finished_at'=>'datetime']; }