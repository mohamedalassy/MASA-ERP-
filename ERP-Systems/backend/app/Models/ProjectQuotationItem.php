<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProjectQuotationItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'quotation_id',
        'product_id',
        'supplier_id',
        'supplier_price_id',
        'supplier_name_snapshot',
        'supplier_cost_snapshot',
        'supplier_lead_time_snapshot',
        'supplier_valid_until_snapshot',
        'product_name',
        'sku',
        'description',
        'unit',
        'section',
        'item_type',
        'quantity',
        'cost_price',
        'unit_price',
        'discount',
        'tax_rate',
        'tax_amount',
        'line_total',
        'profit_amount',
        'profit_margin',
        'sort_order',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'supplier_cost_snapshot' => 'decimal:2',
        'supplier_lead_time_snapshot' => 'integer',
        'supplier_valid_until_snapshot' => 'date',
        'unit_price' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
        'profit_amount' => 'decimal:2',
        'profit_margin' => 'decimal:2',
    ];

    public function quotation()
    {
        return $this->belongsTo(
            ProjectQuotation::class,
            'quotation_id'
        );
    }

    public function product()
    {
        return $this->belongsTo(
            Product::class,
            'product_id'
        );
    }

    public function supplier()
    {
        return $this->belongsTo(
            Supplier::class,
            'supplier_id'
        );
    }

    public function supplierPrice()
    {
        return $this->belongsTo(
            SupplierPrice::class,
            'supplier_price_id'
        );
    }
}
