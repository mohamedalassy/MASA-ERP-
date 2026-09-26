<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectNote;
use App\Models\ProjectNoteAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProjectNoteController extends Controller
{
    public function index(Project $project)
    {
        $notes = ProjectNote::query()
            ->where('project_id', $project->id)
            ->with(['user:id,name', 'attachments'])
            ->orderByDesc('is_pinned')
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $notes]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content_html' => ['required', 'string', 'max:200000'],
            'is_pinned' => ['nullable', 'boolean'],
        ]);

        $html = $this->sanitizeHtml($validated['content_html']);
        $text = trim(html_entity_decode(strip_tags($html)));

        if ($text === '' && !str_contains($html, '<img') && !str_contains($html, '<video') && !str_contains($html, '<iframe')) {
            return response()->json(['success' => false, 'message' => 'اكتب محتوى الملاحظة أولاً.'], 422);
        }

        $note = DB::transaction(function () use ($request, $project, $validated, $html, $text) {
            $note = ProjectNote::create([
                'project_id' => $project->id,
                'user_id' => $request->user()?->id,
                'title' => $validated['title'] ?? null,
                'content_html' => $html,
                'content_text' => $text,
                'is_pinned' => (bool)($validated['is_pinned'] ?? false),
            ]);

            AuditLog::create([
                'user_id' => $request->user()?->id,
                'action' => 'project_note_created',
                'module' => 'project',
                'record_id' => $project->id,
                'title' => 'تمت إضافة ملاحظة للمشروع',
                'description' => mb_substr($text ?: ($validated['title'] ?? 'ملاحظة جديدة'), 0, 500),
                'new_values' => ['project_note_id' => $note->id],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return $note;
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ الملاحظة.',
            'data' => $note->load(['user:id,name', 'attachments']),
        ], 201);
    }

    public function update(Request $request, Project $project, ProjectNote $note)
    {
        $this->assertProject($project, $note);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content_html' => ['required', 'string', 'max:200000'],
            'is_pinned' => ['nullable', 'boolean'],
        ]);

        $html = $this->sanitizeHtml($validated['content_html']);
        $text = trim(html_entity_decode(strip_tags($html)));

        $note->update([
            'title' => $validated['title'] ?? null,
            'content_html' => $html,
            'content_text' => $text,
            'is_pinned' => (bool)($validated['is_pinned'] ?? false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الملاحظة.',
            'data' => $note->fresh()->load(['user:id,name', 'attachments']),
        ]);
    }

    public function destroy(Project $project, ProjectNote $note)
    {
        $this->assertProject($project, $note);
        $note->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف الملاحظة.']);
    }

    public function upload(Request $request, Project $project, ProjectNote $note)
    {
        $this->assertProject($project, $note);

        $validated = $request->validate([
            'file' => [
                'required',
                'file',
                'max:102400',
                'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ],
        ]);

        $file = $validated['file'];
        $mime = $file->getMimeType() ?: $file->getClientMimeType();
        $type = str_starts_with($mime, 'image/')
            ? 'image'
            : (str_starts_with($mime, 'video/') ? 'video' : 'file');

        $path = $file->store("projects/{$project->id}/notes/{$note->id}", 'public');

        $attachment = ProjectNoteAttachment::create([
            'project_note_id' => $note->id,
            'user_id' => $request->user()?->id,
            'type' => $type,
            'original_name' => $file->getClientOriginalName(),
            'disk' => 'public',
            'path' => $path,
            'mime_type' => $mime,
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم رفع الملف.',
            'data' => $attachment,
        ], 201);
    }

    public function deleteAttachment(Project $project, ProjectNote $note, ProjectNoteAttachment $attachment)
    {
        $this->assertProject($project, $note);

        abort_unless($attachment->project_note_id === $note->id, 404);

        if ($attachment->path) {
            Storage::disk($attachment->disk ?: 'public')->delete($attachment->path);
        }

        $attachment->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف المرفق.']);
    }

    private function assertProject(Project $project, ProjectNote $note): void
    {
        abort_unless($note->project_id === $project->id, 404);
    }

    private function sanitizeHtml(string $html): string
    {
        $allowed = '<p><br><div><span><strong><b><em><i><u><s><strike><h1><h2><h3><h4><ul><ol><li><blockquote><pre><code><a><img><video><source><iframe><table><thead><tbody><tr><th><td><hr>';
        $clean = strip_tags($html, $allowed);

        // Remove event handlers, scripts in attributes and javascript: URLs.
        $clean = preg_replace('/\son\w+\s*=\s*(["\']).*?\1/isu', '', $clean) ?? $clean;
        $clean = preg_replace('/javascript\s*:/isu', '', $clean) ?? $clean;

        return $clean;
    }
}
