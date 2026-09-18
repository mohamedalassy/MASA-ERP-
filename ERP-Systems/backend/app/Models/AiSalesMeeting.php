<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesMeeting extends Model{protected $fillable=['company_id', 'opportunity_id', 'title', 'meeting_at', 'notes', 'summary', 'commitments', 'objections', 'next_actions'];protected $casts=['commitments'=>'array','objections'=>'array','next_actions'=>'array'];}