<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesContractItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_contract_id',
        'product_id',
        'description',
        'quantity',
        'unit_price',
        'line_total',
        'service_start_date',
        'service_end_date',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
        'service_start_date' => 'date',
        'service_end_date' => 'date',
    ];

    public function contract()
    {
        return $this->belongsTo(SalesContract::class, 'sales_contract_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
