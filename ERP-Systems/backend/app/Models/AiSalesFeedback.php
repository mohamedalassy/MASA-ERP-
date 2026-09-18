<?php
namespace App\Models;use Illuminate\Database\Eloquent\Model;
class AiSalesFeedback extends Model{protected $fillable=['subject_type', 'subject_id', 'rating', 'comment', 'user_id'];}