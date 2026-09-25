<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiSalesCommunication extends Model
{
    protected $fillable=[
        'company_id','lead_id','contact_id','channel','direction','subject','body','status','sent_at','metadata'
    ];

    protected $casts=['sent_at'=>'datetime','metadata'=>'array'];

    public function company()
    {
        return $this->belongsTo(AiSalesCompany::class,'company_id');
    }
}
