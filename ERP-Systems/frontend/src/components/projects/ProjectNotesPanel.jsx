import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote,
  Link2, Image, Video, Paperclip, Palette, Highlighter, Heading1,
  Heading2, Heading3, AlignRight, AlignCenter, AlignLeft, Pin,
  Plus, X, Save, Trash2, Edit3, ExternalLink, Loader2
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8000";
const API_URL = `${BACKEND_URL}/api`;

async function initializeCsrf() {
  const response = await fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("تعذر تهيئة الاتصال الآمن مع الخادم.");
}
function xsrf() {
  const row = document.cookie.split("; ").find(v => v.startsWith("XSRF-TOKEN="));
  return row ? decodeURIComponent(row.substring("XSRF-TOKEN=".length)) : "";
}
async function api(url, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const write = !["GET", "HEAD", "OPTIONS"].includes(method);
  if (write) await initializeCsrf();
  const token = write ? xsrf() : "";
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(write && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-XSRF-TOKEN": token } : {}),
      ...(options.headers || {}),
    },
  });
}
async function json(response) {
  let result = {};
  try { result = await response.json(); } catch {}
  if (!response.ok || result.success === false) {
    const validation = result.errors ? Object.values(result.errors).flat()[0] : null;
    throw new Error(validation || result.message || "تعذر تنفيذ العملية.");
  }
  return result;
}

const COLORS = ["#111827","#374151","#6657F5","#2563EB","#059669","#D97706","#DC2626","#9333EA"];
const HIGHLIGHTS = ["#FEF3C7","#DBEAFE","#DCFCE7","#FCE7F3","#EDE9FE","#F3F4F6"];

export default function ProjectNotesPanel({ projectId }) {
  const editorRef = useRef(null);
  const fileRef = useRef(null);
  const [notes,setNotes]=useState([]);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState(null);
  const [title,setTitle]=useState("");
  const [pinned,setPinned]=useState(false);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  const load=async()=>{
    if(!projectId) return;
    try{
      setLoading(true); setError("");
      const r=await api(`${API_URL}/projects/${projectId}/notes`);
      const x=await json(r);
      setNotes(Array.isArray(x.data)?x.data:[]);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  };
  useEffect(()=>{load()},[projectId]);

  const cmd=(name,value=null)=>{
    editorRef.current?.focus();
    document.execCommand(name,false,value);
  };
  const openNew=()=>{
    setEditing(null);setTitle("");setPinned(false);setError("");setMessage("");setOpen(true);
    setTimeout(()=>{if(editorRef.current) editorRef.current.innerHTML=""},0);
  };
  const openEdit=(n)=>{
    setEditing(n);setTitle(n.title||"");setPinned(Boolean(n.is_pinned));setError("");setMessage("");setOpen(true);
    setTimeout(()=>{if(editorRef.current) editorRef.current.innerHTML=n.content_html||""},0);
  };
  const insertHtml=(html)=>{
    editorRef.current?.focus();
    document.execCommand("insertHTML",false,html);
  };
  const addLink=()=>{
    const url=window.prompt("رابط الموقع:");
    if(url) cmd("createLink",url);
  };
  const addImageUrl=()=>{
    const url=window.prompt("رابط الصورة:");
    if(url) insertHtml(`<img src="${url}" alt="" style="max-width:100%;border-radius:12px;margin:10px 0" />`);
  };
  const addVideoUrl=()=>{
    const url=window.prompt("رابط الفيديو المباشر MP4/WebM أو YouTube:");
    if(!url) return;
    const yt=url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if(yt){
      insertHtml(`<iframe src="https://www.youtube.com/embed/${yt[1]}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:12px;margin:10px 0" allowfullscreen></iframe>`);
    }else{
      insertHtml(`<video controls src="${url}" style="width:100%;max-height:520px;border-radius:12px;margin:10px 0"></video>`);
    }
  };

  const save=async()=>{
    const content=editorRef.current?.innerHTML||"";
    if(!content.replace(/<[^>]*>/g,"").trim() && !/<(img|video|iframe)/i.test(content)){
      setError("اكتب محتوى الملاحظة أولاً."); return;
    }
    try{
      setBusy(true);setError("");setMessage("");
      const url=editing
        ? `${API_URL}/projects/${projectId}/notes/${editing.id}`
        : `${API_URL}/projects/${projectId}/notes`;
      const r=await api(url,{method:editing?"PUT":"POST",body:JSON.stringify({
        title:title.trim()||null,content_html:content,is_pinned:pinned
      })});
      const x=await json(r);
      setMessage(x.message||"تم الحفظ.");
      setOpen(false); await load();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  };

  const remove=async(n)=>{
    if(!window.confirm("حذف الملاحظة؟")) return;
    try{
      setError("");
      await json(await api(`${API_URL}/projects/${projectId}/notes/${n.id}`,{method:"DELETE"}));
      await load();
    }catch(e){setError(e.message)}
  };

  const upload=async(file)=>{
    if(!file) return;
    if(!editing?.id){
      setError("احفظ الملاحظة أولاً، ثم افتح تعديلها لإرفاق الصور أو الفيديو أو الملفات.");
      return;
    }
    try{
      setBusy(true);setError("");
      const fd=new FormData(); fd.append("file",file);
      const x=await json(await api(`${API_URL}/projects/${projectId}/notes/${editing.id}/attachments`,{
        method:"POST",body:fd
      }));
      const a=x.data;
      if(a?.url && a.type==="image") insertHtml(`<img src="${a.url}" alt="${a.original_name||""}" style="max-width:100%;border-radius:12px;margin:10px 0" />`);
      else if(a?.url && a.type==="video") insertHtml(`<video controls src="${a.url}" style="width:100%;max-height:520px;border-radius:12px;margin:10px 0"></video>`);
      else if(a?.url) insertHtml(`<p><a href="${a.url}" target="_blank" rel="noreferrer">📎 ${a.original_name||"مرفق"}</a></p>`);
    }catch(e){setError(e.message)}finally{setBusy(false); if(fileRef.current) fileRef.current.value=""}
  };

  return <section id="project-notes-section" className="masa-notes">
    <style>{`
      .masa-notes{background:#fff;border:1px solid #ececf4;border-radius:18px;padding:20px;box-shadow:0 8px 24px rgba(17,24,39,.04)}
      .mn-head,.mn-title,.mn-actions,.mn-toolbar,.mn-note-top{display:flex;align-items:center}
      .mn-head{justify-content:space-between;gap:14px;margin-bottom:16px}.mn-head h3{margin:0;font-size:18px}
      .mn-primary{border:0;background:#6657F5;color:#fff;border-radius:11px;padding:10px 14px;font-weight:800;display:flex;gap:7px;align-items:center;cursor:pointer}
      .mn-note{border:1px solid #ececf4;border-radius:15px;padding:16px;margin-top:12px;background:#fff}.mn-note.pinned{border-color:#cfc9ff;background:#fcfbff}
      .mn-note-top{justify-content:space-between;gap:10px}.mn-title{gap:8px}.mn-title strong{font-size:16px}.mn-date{font-size:12px;color:#8b93a7}
      .mn-body{font-size:15px;line-height:1.9;color:#313747;overflow:auto}.mn-body img,.mn-body video,.mn-body iframe{max-width:100%}
      .mn-actions{gap:6px}.mn-icon{border:1px solid #e5e7eb;background:#fff;border-radius:9px;width:34px;height:34px;display:grid;place-items:center;cursor:pointer}
      .mn-empty{padding:28px;text-align:center;color:#8b93a7;border:1px dashed #dfe1e8;border-radius:14px}
      .mn-modal{position:fixed;inset:0;background:rgba(17,24,39,.48);z-index:9999;display:grid;place-items:center;padding:24px}
      .mn-dialog{width:min(1000px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 24px 80px rgba(0,0,0,.22)}
      .mn-dialog-head{padding:18px 20px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center}.mn-dialog-head h3{margin:0;font-size:20px}
      .mn-form{padding:18px 20px}.mn-input{width:100%;box-sizing:border-box;border:1px solid #dfe1e8;border-radius:11px;padding:12px 14px;font-size:15px;margin-bottom:12px}
      .mn-toolbar{gap:5px;flex-wrap:wrap;padding:9px;background:#f7f7fb;border:1px solid #e6e7ee;border-radius:12px 12px 0 0}
      .mn-tool{width:34px;height:34px;border:1px solid transparent;background:#fff;border-radius:8px;display:grid;place-items:center;cursor:pointer}.mn-tool:hover{border-color:#cfc9ff;color:#6657F5}
      .mn-sep{width:1px;height:24px;background:#ddd;margin:0 3px}.mn-select{height:34px;border:1px solid #ddd;border-radius:8px;background:#fff;padding:0 8px}
      .mn-color{width:28px;height:28px;border:0;padding:0;background:none;cursor:pointer}.mn-editor{min-height:280px;border:1px solid #e6e7ee;border-top:0;border-radius:0 0 12px 12px;padding:16px;outline:none;font-size:16px;line-height:1.9}
      .mn-editor:focus{border-color:#a9a1ff;box-shadow:0 0 0 3px rgba(102,87,245,.08)}
      .mn-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px}.mn-pin{display:flex;gap:7px;align-items:center;font-size:14px;font-weight:700}
      .mn-save{border:0;background:#6657F5;color:#fff;border-radius:11px;padding:11px 18px;font-weight:800;cursor:pointer}.mn-save:disabled{opacity:.6}
      .mn-msg{margin:10px 0;padding:10px 12px;border-radius:10px;font-size:13px}.mn-error{background:#fff1f2;color:#be123c}.mn-ok{background:#ecfdf5;color:#047857}
    `}</style>

    <div className="mn-head">
      <div><h3>ملاحظات المشروع</h3><div className="mn-date">محرر متقدم يدعم التنسيق والصور والفيديو والمرفقات</div></div>
      <button type="button" className="mn-primary" onClick={openNew}><Plus size={16}/>إضافة ملاحظة</button>
    </div>

    {error && <div className="mn-msg mn-error">{error}</div>}
    {message && <div className="mn-msg mn-ok">{message}</div>}
    {loading ? <div className="mn-empty"><Loader2 size={18}/> جاري تحميل الملاحظات...</div> :
      notes.length ? notes.map(n=><article key={n.id} className={`mn-note ${n.is_pinned?"pinned":""}`}>
        <div className="mn-note-top">
          <div className="mn-title">{n.is_pinned&&<Pin size={15}/>}<strong>{n.title||"ملاحظة"}</strong></div>
          <div className="mn-actions">
            <button className="mn-icon" type="button" title="تعديل" onClick={()=>openEdit(n)}><Edit3 size={15}/></button>
            <button className="mn-icon" type="button" title="حذف" onClick={()=>remove(n)}><Trash2 size={15}/></button>
          </div>
        </div>
        <div className="mn-date">{n.user?.name||"مستخدم النظام"} · {n.created_at?new Date(n.created_at).toLocaleString("ar-SA"):""}</div>
        <div className="mn-body" dangerouslySetInnerHTML={{__html:n.content_html||""}} />
        {!!n.attachments?.length && <div className="mn-actions">{n.attachments.map(a=><a key={a.id} href={a.url} target="_blank" rel="noreferrer"><ExternalLink size={14}/> {a.original_name}</a>)}</div>}
      </article>) : <div className="mn-empty">لا توجد ملاحظات على المشروع حتى الآن.</div>
    }

    {open&&<div className="mn-modal" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setOpen(false)}}>
      <div className="mn-dialog">
        <div className="mn-dialog-head"><h3>{editing?"تعديل الملاحظة":"ملاحظة جديدة"}</h3><button className="mn-icon" type="button" onClick={()=>!busy&&setOpen(false)}><X size={18}/></button></div>
        <div className="mn-form">
          <input className="mn-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان الملاحظة (اختياري)" />
          <div className="mn-toolbar">
            <button className="mn-tool" type="button" onClick={()=>cmd("bold")} title="عريض"><Bold size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("italic")} title="مائل"><Italic size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("underline")} title="تحته خط"><Underline size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("strikeThrough")} title="يتوسطه خط"><Strikethrough size={16}/></button>
            <span className="mn-sep"/>
            <button className="mn-tool" type="button" onClick={()=>cmd("formatBlock","H1")}><Heading1 size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("formatBlock","H2")}><Heading2 size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("formatBlock","H3")}><Heading3 size={16}/></button>
            <select className="mn-select" defaultValue="3" onChange={e=>cmd("fontSize",e.target.value)} title="حجم الخط">
              <option value="2">صغير</option><option value="3">عادي</option><option value="4">كبير</option><option value="5">كبير جدًا</option><option value="6">عنوان</option>
            </select>
            <select className="mn-select" defaultValue="Arial" onChange={e=>cmd("fontName",e.target.value)} title="نوع الخط">
              <option>Arial</option><option>Tahoma</option><option>Verdana</option><option>Georgia</option><option>Courier New</option>
            </select>
            <span className="mn-sep"/>
            <input className="mn-color" type="color" title="لون الخط" onChange={e=>cmd("foreColor",e.target.value)}/>
            <input className="mn-color" type="color" title="لون التظليل" onChange={e=>cmd("hiliteColor",e.target.value)}/>
            <button className="mn-tool" type="button" onClick={()=>cmd("justifyRight")}><AlignRight size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("justifyCenter")}><AlignCenter size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("justifyLeft")}><AlignLeft size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("insertUnorderedList")}><List size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("insertOrderedList")}><ListOrdered size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>cmd("formatBlock","blockquote")}><Quote size={16}/></button>
            <span className="mn-sep"/>
            <button className="mn-tool" type="button" onClick={addLink} title="رابط"><Link2 size={16}/></button>
            <button className="mn-tool" type="button" onClick={addImageUrl} title="صورة برابط"><Image size={16}/></button>
            <button className="mn-tool" type="button" onClick={addVideoUrl} title="فيديو برابط"><Video size={16}/></button>
            <button className="mn-tool" type="button" onClick={()=>fileRef.current?.click()} title="رفع صورة / فيديو / ملف"><Paperclip size={16}/></button>
            <input ref={fileRef} type="file" hidden accept="image/*,video/mp4,video/webm,video/quicktime,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={e=>upload(e.target.files?.[0])}/>
          </div>
          <div ref={editorRef} className="mn-editor" contentEditable suppressContentEditableWarning data-placeholder="اكتب الملاحظة هنا..." />
          {error&&<div className="mn-msg mn-error">{error}</div>}
          <div className="mn-footer">
            <label className="mn-pin"><input type="checkbox" checked={pinned} onChange={e=>setPinned(e.target.checked)}/><Pin size={15}/> تثبيت الملاحظة</label>
            <button type="button" className="mn-save" disabled={busy} onClick={save}>{busy?<><Loader2 size={15}/> جاري الحفظ...</>:<><Save size={15}/> حفظ الملاحظة</>}</button>
          </div>
        </div>
      </div>
    </div>}
  </section>;
}
