<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class HrGovernmentConnectorCapability extends Model { protected $fillable=['connector_id','capability_code','name','mode','enabled','configuration']; protected $casts=['enabled'=>'boolean','configuration'=>'array']; public function connector(){return $this->belongsTo(HrGovernmentConnector::class,'connector_id');} }
