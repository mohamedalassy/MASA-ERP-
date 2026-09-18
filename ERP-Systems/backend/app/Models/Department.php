<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * القسم — كان كلاسًا فاضيًا في الريبو.
 *
 * ⚠ ده غير `HrDepartment` — ده قسم **صلاحيات وسير عمل**،
 * وده قسم **هيكل تنظيمي للموظفين**. لو عايز توحّدهم قول لي.
 */
class Department extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code', 'name', 'name_en', 'parent_id', 'manager_id',
        'workflow_stage', 'is_active', 'description',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function permissions(): HasMany
    {
        return $this->hasMany(DepartmentPermission::class, 'department_id');
    }
}
