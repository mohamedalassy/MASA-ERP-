<?php
namespace App\Models; use Illuminate\Database\Eloquent\Model; use Illuminate\Database\Eloquent\Relations\BelongsTo;
class HrEmployeeDocument extends Model {protected $fillable=['employee_id','document_type','document_number','issue_date','expiry_date','file_path','status','notes'];public function employee():BelongsTo{return $this->belongsTo(HrEmployee::class);}}