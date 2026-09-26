<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ProjectNoteAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_note_id',
        'user_id',
        'type',
        'original_name',
        'disk',
        'path',
        'mime_type',
        'size',
    ];

    protected $appends = ['url'];

    public function note()
    {
        return $this->belongsTo(ProjectNote::class, 'project_note_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getUrlAttribute(): ?string
    {
        return $this->path ? Storage::disk($this->disk ?: 'public')->url($this->path) : null;
    }
}
