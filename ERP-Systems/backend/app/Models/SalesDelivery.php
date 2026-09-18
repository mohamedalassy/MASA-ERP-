<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesDelivery extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'sales_order_id',
        'project_id',
        'delivery_number',
        'status',
        'delivery_date',
        'delivered_by',
        'received_by_name',
        'received_by_phone',
        'notes',
    ];

    protected $casts = [
        'delivery_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function salesOrder()
    {
        return $this->belongsTo(SalesOrder::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function items()
    {
        return $this->hasMany(SalesDeliveryItem::class);
    }

    public function deliveredBy()
    {
        return $this->belongsTo(User::class, 'delivered_by');
    }
}
