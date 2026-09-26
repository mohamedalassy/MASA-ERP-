<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HrLeaveEntitlement extends Model
{
    protected $fillable = ['employee_id', 'year', 'annual_days', 'updated_by'];

    protected $casts = ['year' => 'integer', 'annual_days' => 'integer'];
}
