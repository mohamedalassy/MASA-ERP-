<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrAnnouncement extends Model { protected $fillable=['title','body','audience','audience_ids','publish_at','expires_at','is_pinned','created_by']; protected $casts=['audience_ids'=>'array','publish_at'=>'datetime','expires_at'=>'datetime','is_pinned'=>'boolean']; }
