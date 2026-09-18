<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrLetterRequest extends Model { protected $fillable=['request_number','employee_id','letter_type','language','addressed_to','purpose','status','document_path','issued_at']; protected $casts=['issued_at'=>'datetime']; public function employee(){return $this->belongsTo(HrEmployee::class);} }
