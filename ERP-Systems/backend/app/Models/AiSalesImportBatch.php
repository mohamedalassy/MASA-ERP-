<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model;
class AiSalesImportBatch extends Model {protected $fillable=['source','filename','status','total_rows','created_rows','updated_rows','skipped_rows','errors','started_at','finished_at','created_by'];protected $casts=['errors'=>'array','started_at'=>'datetime','finished_at'=>'datetime'];}