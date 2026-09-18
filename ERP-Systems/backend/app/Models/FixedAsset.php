<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class FixedAsset extends Model {
 protected $fillable=['asset_code','name','description','finance_account_id','accumulated_depreciation_account_id','depreciation_expense_account_id','purchase_date','in_service_date','cost','salvage_value','useful_life_months','status','disposal_date','disposal_proceeds','disposal_type','disposal_notes','created_by'];
 protected $casts=['purchase_date'=>'date','in_service_date'=>'date','disposal_date'=>'date','cost'=>'decimal:2','salvage_value'=>'decimal:2','disposal_proceeds'=>'decimal:2','useful_life_months'=>'integer'];
}
