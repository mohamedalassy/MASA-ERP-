import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Plus, RefreshCw, Pencil, Trash2, Clock3, Save, X } from "lucide-react";
import { hrGet, hrPost, hrPatch, hrDelete } from "./hrApi";
import "./hr-v2.css";
import "./hr-v2-stage2.css";

const statuses = { scheduled: "مجدول", day_off: "راحة", leave: "إجازة", holiday: "عطلة", cancelled: "ملغي" };
const field = { width: "100%", boxSizing: "border-box", border: "1px solid #dfe3ef", borderRadius: 10, padding: "10px 12px", font: "inherit" };
const formGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 };
const formInitial = () => ({ employee_id: "", work_date: new Date().toLocaleDateString("en-CA"), shift_id: "", status: "scheduled", planned_start: "", planned_end: "", notes: "" });
const shiftInitial = () => ({ code: "", name: "", start_time: "08:00", end_time: "17:00", break_minutes: 60, late_grace_minutes: 0, early_leave_grace_minutes: 0, overtime_allowed: false, overtime_after_minutes: 0, is_flexible: false, working_days: [0, 1, 2, 3, 4] });
const weekdays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const shiftMinutes = (start, end, breakMinutes) => {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  let duration = endH * 60 + endM - startH * 60 - startM;
  if (duration <= 0) duration += 1440;
  return duration - Number(breakMinutes || 0);
};
const monthRange = month => {
  const [year, part] = month.split("-").map(Number);
  const last = new Date(year, part, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
};
const unwrap = result => Array.isArray(result?.data) ? result.data : result?.data?.data || [];

export default function RosterPlanner() {
  const [month, setMonth] = useState(() => new Date().toLocaleDateString("en-CA").slice(0, 7));
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [form, setForm] = useState(formInitial);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulk, setBulk] = useState(() => ({ employee_id: "", shift_id: "", ...monthRange(new Date().toLocaleDateString("en-CA").slice(0, 7)), notes: "" }));
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [shiftForm, setShiftForm] = useState(shiftInitial);
  const [editingShift, setEditingShift] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const shiftFormRef = useRef(null);
  const rosterFormRef = useRef(null);
  const bulkFormRef = useRef(null);
  const feedbackRef = useRef(null);
  useEffect(() => {
    const target = showShiftForm ? shiftFormRef.current : showBulkForm ? bulkFormRef.current : showForm ? rosterFormRef.current : null;
    if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [showShiftForm, showBulkForm, showForm, editingShift, editing]);
  useEffect(() => {
    if (error && feedbackRef.current) feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const load = useCallback(async () => {
    setError("");
    try {
      const { from, to } = monthRange(month);
      const result = await hrGet(`/hr/v2/rosters?from=${from}&to=${to}&page=${page}&per_page=100`);
      setRows(unwrap(result));
      setLastPage(result.last_page || result.data?.last_page || 1);
    } catch (e) { setError(e.message); }
  }, [month, page]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    hrGet("/hr/employees?per_page=100").then(people => setEmployees(unwrap(people))).catch(e => setError(`تعذر تحميل الموظفين: ${e.message}`));
    hrGet("/hr/shifts?per_page=100").then(shiftList => setShifts(unwrap(shiftList))).catch(e => setError(`تعذر تحميل أنواع الورديات: ${e.message}`));
  }, []);

  const reveal = ref => requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const updateShift = (key, value) => setShiftForm(previous => ({ ...previous, [key]: value }));
  const startShift = () => { setEditingShift(null); setShiftForm(shiftInitial()); setShowShiftForm(true); setNotice(""); reveal(shiftFormRef); };
  const editShift = item => {
    setEditingShift(item.id);
    setShiftForm({ code: item.code || "", name: item.name || "", start_time: item.start_time?.slice(0, 5) || "08:00", end_time: item.end_time?.slice(0, 5) || "17:00", break_minutes: item.break_minutes ?? 0, late_grace_minutes: item.late_grace_minutes ?? 0, early_leave_grace_minutes: item.early_leave_grace_minutes ?? 0, overtime_allowed: Boolean(item.overtime_allowed), overtime_after_minutes: item.overtime_after_minutes ?? 0, is_flexible: Boolean(item.is_flexible), working_days: Array.isArray(item.working_days) ? item.working_days.map(Number) : [0, 1, 2, 3, 4] });
    setShowShiftForm(true); setNotice(""); reveal(shiftFormRef);
  };
  const persistShift = async values => {
    const required_minutes = shiftMinutes(values.start_time, values.end_time, values.break_minutes);
    if (required_minutes <= 0) throw new Error("وقت الاستراحة يجب أن يكون أقل من مدة الوردية.");
    if (!values.working_days.length) throw new Error("اختر يوم عمل واحدًا على الأقل.");
    const payload = { ...values, code: values.code.trim().toUpperCase(), name: values.name.trim(), required_minutes, crosses_midnight: values.end_time <= values.start_time, is_active: true };
    const created = editingShift ? await hrPatch(`/hr/shifts/${editingShift}`, payload) : await hrPost("/hr/shifts", payload);
    const refreshed = await hrGet("/hr/shifts?per_page=100");
    const newShift = created.data?.id ? created.data : created;
    const available = unwrap(refreshed);
    setShifts(available.some(item => item.id === newShift.id) ? available : [newShift, ...available]);
    setForm(previous => ({ ...previous, shift_id: String(newShift.id), planned_start: newShift.start_time?.slice(0, 5) || values.start_time, planned_end: newShift.end_time?.slice(0, 5) || values.end_time }));
    setShowShiftForm(false); setEditingShift(null); setNotice(editingShift ? "تم تعديل توقيت الوردية." : "تم إنشاء نوع الوردية. اختاره الآن لموظف وتاريخ.");
  };
  const createShift = async event => {
    event.preventDefault(); setError(""); setNotice("");
    setBusy(true);
    try {
      await persistShift(shiftForm); setShiftForm(shiftInitial());
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const quickShift = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      setEditingShift(null);
      const values = { ...shiftInitial(), code: `DAY-${Date.now().toString(36).toUpperCase()}`, name: "الوردية الصباحية" };
      const required_minutes = shiftMinutes(values.start_time, values.end_time, values.break_minutes);
      const created = await hrPost("/hr/shifts", { ...values, required_minutes, crosses_midnight: false, is_active: true });
      const refreshed = await hrGet("/hr/shifts?per_page=100");
      const newShift = created.data?.id ? created.data : created;
      const available = unwrap(refreshed);
      setShifts(available.some(item => item.id === newShift.id) ? available : [newShift, ...available]);
      setForm(previous => ({ ...previous, shift_id: String(newShift.id), planned_start: values.start_time, planned_end: values.end_time }));
      setShowShiftForm(false); setNotice("تم إنشاء نوع الوردية. اختاره الآن لموظف وتاريخ.");
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const startNew = () => { setEditing(null); setForm({ ...formInitial(), work_date: `${month}-01` }); setShowBulkForm(false); setShowForm(true); setShowShiftForm(!shifts.length); setNotice(""); reveal(shifts.length ? rosterFormRef : shiftFormRef); };
  const startEdit = item => {
    setEditing(item.id);
    setForm({ employee_id: String(item.employee_id), work_date: item.work_date.slice(0, 10), shift_id: item.shift_id ? String(item.shift_id) : "", status: item.status, planned_start: item.planned_start?.slice(0, 5) || "", planned_end: item.planned_end?.slice(0, 5) || "", notes: item.notes || "" });
    setShowBulkForm(false); setShowShiftForm(false); setShowForm(true); setNotice(""); reveal(rosterFormRef);
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const data = { status: form.status, shift_id: form.status === "scheduled" ? Number(form.shift_id) : null, planned_start: form.status === "scheduled" ? form.planned_start || null : null, planned_end: form.status === "scheduled" ? form.planned_end || null : null, notes: form.notes.trim() || null };
      if (editing) await hrPatch(`/hr/v2/rosters/${editing}`, data);
      else await hrPost("/hr/v2/rosters", { ...data, employee_id: Number(form.employee_id), work_date: form.work_date });
      setShowForm(false); setEditing(null); setNotice(editing ? "تم تحديث الجدول." : "تمت إضافة الجدول.");
      if (form.work_date.slice(0, 7) !== month) { setMonth(form.work_date.slice(0, 7)); setPage(1); }
      else await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const startBulk = () => {
    setBulk(previous => ({ ...previous, ...monthRange(month) }));
    setShowBulkForm(true); setShowForm(false); setShowShiftForm(!shifts.length); setNotice("");
    reveal(shifts.length ? bulkFormRef : shiftFormRef);
  };
  const schedulePeriod = async event => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const result = await hrPost("/hr/v2/rosters/bulk", {
        ...bulk, employee_id: Number(bulk.employee_id), shift_id: Number(bulk.shift_id), notes: bulk.notes.trim() || null,
      });
      const counts = result.data?.created !== undefined ? result.data : result;
      setNotice(`تمت جدولة ${counts.created} يوم. أيام راحة: ${counts.skipped_days_off}، إجازات معتمدة: ${counts.skipped_leave}، جدول موجود: ${counts.skipped_existing}.`);
      setShowBulkForm(false);
      if (bulk.from.slice(0, 7) !== month) { setMonth(bulk.from.slice(0, 7)); setPage(1); }
      else { setPage(1); if (page === 1) await load(); }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async item => {
    if (!window.confirm("حذف وردية هذا الموظف من الجدول؟")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await hrDelete(`/hr/v2/rosters/${item.id}`);
      setNotice("تم حذف السجل من الجدول.");
      if (rows.length === 1 && page > 1) setPage(page - 1);
      else await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  return <section className="pv2-page masa-roster" dir="rtl">
    <style>{`.masa-roster{--masa-purple:#6652ed;--masa-deep:#211d50}.masa-roster .roster-btn{border:1px solid #dcd9f6;border-radius:10px;background:#fff;color:#282254;padding:9px 13px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font:inherit;font-weight:650;cursor:pointer}.masa-roster .roster-btn:hover{border-color:var(--masa-purple);color:var(--masa-purple)}.masa-roster .roster-btn.primary{background:var(--masa-purple);border-color:var(--masa-purple);color:#fff}.masa-roster .roster-btn.primary:hover{background:#5542d8;color:#fff}.masa-roster .roster-btn.danger{color:#ba3545;background:#fff5f5;border-color:#f5d9dc}.masa-roster .roster-btn:disabled{opacity:.55;cursor:not-allowed}.masa-roster .roster-label{display:grid;gap:6px;font-weight:650;color:#302953}.masa-roster .roster-panel{box-shadow:0 6px 24px rgba(28,25,70,.04)}.masa-roster .roster-weekdays{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 16px}.masa-roster .roster-weekdays label{padding:8px 12px;border:1px solid #e2dff2;border-radius:10px;background:#f8f7ff;cursor:pointer}.masa-roster .roster-empty{padding:13px;border-radius:10px;background:#f4f2ff;color:#5542d8}@media(max-width:750px){.masa-roster .att-row{grid-template-columns:repeat(2,minmax(0,1fr))}.masa-roster .att-actions{flex-wrap:wrap}}`}</style>
    <header className="pv2-hero"><div><small>WORKFORCE SCHEDULING</small><h1>جدول الورديات</h1><p>حدّد مواعيد الوردية أولًا، وبعدها وزّعها على الموظف ليوم أو لفترة تختارها.</p></div><div className="att-actions"><CalendarDays size={28} /><button className="roster-btn" type="button" onClick={startShift}><Clock3 size={16} /> إنشاء نوع وردية</button><button className="roster-btn" type="button" onClick={startBulk}><CalendarDays size={16} /> توزيع لفترة</button><button className="roster-btn primary" type="button" onClick={startNew}><Plus size={16} /> إضافة ليوم واحد</button></div></header>
    {error && <div ref={feedbackRef} className="pv2-error" role="alert">{error}</div>}
    {notice && <div className="pv2-panel" role="status" style={{ color: "#187449", marginBottom: 12 }}>{notice}</div>}
    <article className="pv2-panel roster-panel" style={{ marginBottom: 16 }}><div className="att-actions" style={{ justifyContent: "space-between", alignItems: "center" }}><div><h2 style={{ marginBottom: 5 }}>أنواع الورديات ومواعيدها</h2><small>اضبط توقيت كل نوع وردية هنا، ثم عيّنه للموظف من «إضافة للموظف».</small></div><button className="roster-btn primary" type="button" onClick={startShift}><Plus size={16} /> نوع وردية جديد</button></div>
      {!shifts.length && <div className="roster-empty" style={{ marginTop: 14 }}>لا توجد ورديات مسجلة. اضغط «نوع وردية جديد» لتحديد الاسم والمواعيد بنفسك.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 14 }}>{shifts.map(item => <div key={item.id} style={{ border: "1px solid #e5e1f5", borderRadius: 12, padding: 14, background: "#fbfaff" }}><div className="att-actions" style={{ justifyContent: "space-between", alignItems: "center" }}><b>{item.name}</b><button className="roster-btn" type="button" onClick={() => editShift(item)}><Pencil size={15} /> تعديل</button></div><div style={{ marginTop: 8, color: "#575277" }} dir="ltr">{item.start_time?.slice(0, 5)} – {item.end_time?.slice(0, 5)}{item.crosses_midnight ? " (+1)" : ""}</div><small>{item.code} · استراحة {item.break_minutes ?? 0} دقيقة</small></div>)}</div>
    </article>
    <div className="att-actions" style={{ marginBottom: 16 }}><label className="roster-label">الشهر <input type="month" style={field} value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} /></label><button className="roster-btn" type="button" onClick={load}><RefreshCw size={16} /> تحديث</button></div>
    {showBulkForm && <form ref={bulkFormRef} className="pv2-panel roster-panel" onSubmit={schedulePeriod} style={{ marginBottom: 16 }}><h2>توزيع وردية لفترة</h2><p>تُجدول أيام عمل الوردية فقط. الإجازات المعتمدة والأيام ذات الجدول الموجود تُترك كما هي.</p><div style={formGrid}>
      <label className="roster-label">الموظف<select required style={field} value={bulk.employee_id} onChange={e => setBulk(previous => ({ ...previous, employee_id: e.target.value }))}><option value="">اختر موظفًا</option>{employees.map(e => <option key={e.id} value={e.id}>{e.employee_number} — {e.first_name} {e.last_name}</option>)}</select></label>
      <label className="roster-label">الوردية<select required style={field} value={bulk.shift_id} onChange={e => setBulk(previous => ({ ...previous, shift_id: e.target.value }))}><option value="">اختر وردية</option>{shifts.filter(s => s.is_active !== false).map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)})</option>)}</select></label>
      <label className="roster-label">من تاريخ<input type="date" required style={field} value={bulk.from} onChange={e => setBulk(previous => ({ ...previous, from: e.target.value }))} /></label>
      <label className="roster-label">إلى تاريخ<input type="date" required min={bulk.from} style={field} value={bulk.to} onChange={e => setBulk(previous => ({ ...previous, to: e.target.value }))} /></label>
      <label className="roster-label">ملاحظات<input style={field} maxLength={1000} value={bulk.notes} onChange={e => setBulk(previous => ({ ...previous, notes: e.target.value }))} /></label>
    </div><div className="att-actions"><button className="roster-btn primary" type="submit" disabled={busy || !bulk.shift_id}><CalendarDays size={16} /> جدولة الفترة</button><button className="roster-btn" type="button" onClick={() => setShowBulkForm(false)}><X size={16} /> إلغاء</button></div></form>}
    {showShiftForm && <form ref={shiftFormRef} className="pv2-panel roster-panel" onSubmit={createShift} style={{ marginBottom: 16 }}><h2>{editingShift ? "تعديل نوع الوردية ومواعيده" : "إنشاء نوع وردية بمواعيدك"}</h2><div style={formGrid}>
      <label className="roster-label">كود الوردية<input style={field} required maxLength={30} value={shiftForm.code} onChange={e => updateShift("code", e.target.value)} placeholder="مثال: DAY-01" /></label>
      <label className="roster-label">اسم الوردية<input style={field} required value={shiftForm.name} onChange={e => updateShift("name", e.target.value)} placeholder="مثال: الوردية الصباحية" /></label>
      <label className="roster-label">وقت البداية<input style={field} type="time" required value={shiftForm.start_time} onChange={e => updateShift("start_time", e.target.value)} /></label>
      <label className="roster-label">وقت النهاية<input style={field} type="time" required value={shiftForm.end_time} onChange={e => updateShift("end_time", e.target.value)} /></label>
      <label className="roster-label">الاستراحة بالدقائق<input style={field} type="number" min="0" max="1439" required value={shiftForm.break_minutes} onChange={e => updateShift("break_minutes", e.target.value)} /></label>
      <label className="roster-label">سماح التأخير بالدقائق<input style={field} type="number" min="0" required value={shiftForm.late_grace_minutes} onChange={e => updateShift("late_grace_minutes", e.target.value)} /></label>
      <label className="roster-label">سماح الانصراف المبكر بالدقائق<input style={field} type="number" min="0" required value={shiftForm.early_leave_grace_minutes} onChange={e => updateShift("early_leave_grace_minutes", e.target.value)} /></label>
      <label className="roster-label">إضافي بعد كم دقيقة؟<input style={field} type="number" min="0" required disabled={!shiftForm.overtime_allowed} value={shiftForm.overtime_after_minutes} onChange={e => updateShift("overtime_after_minutes", e.target.value)} /></label>
    </div><b>أيام العمل</b><div className="roster-weekdays">{weekdays.map((day, index) => <label key={day}><input type="checkbox" checked={shiftForm.working_days.includes(index)} onChange={e => updateShift("working_days", e.target.checked ? [...shiftForm.working_days, index].sort() : shiftForm.working_days.filter(n => n !== index))} /> {day}</label>)}</div>
    <div className="roster-weekdays"><label><input type="checkbox" checked={shiftForm.is_flexible} onChange={e => updateShift("is_flexible", e.target.checked)} /> مواعيد مرنة</label><label><input type="checkbox" checked={shiftForm.overtime_allowed} onChange={e => updateShift("overtime_allowed", e.target.checked)} /> السماح بالعمل الإضافي</label></div>
    <div className="att-actions"><button className="roster-btn primary" type="submit" disabled={busy}><Save size={16} /> {editingShift ? "حفظ تعديل الوردية" : "حفظ نوع الوردية"}</button><button className="roster-btn" type="button" onClick={() => setShowShiftForm(false)}><X size={16} /> إلغاء</button></div></form>}
    {showForm && shifts.length === 0 && <div className="roster-empty" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}><b>قائمة الورديات فاضية. أنشئ نوع وردية أولًا قبل حفظ الجدول.</b><button className="roster-btn primary" type="button" disabled={busy} onClick={quickShift}><Plus size={16} /> إنشاء وردية صباحية 08:00–17:00</button><button className="roster-btn" type="button" onClick={() => setShowShiftForm(true)}>تخصيص المواعيد</button></div>}
    {showForm && <form ref={rosterFormRef} className="pv2-panel roster-panel" onSubmit={save} style={{ marginBottom: 16 }}><h2>{editing ? "تعديل الوردية" : "إضافة وردية"}</h2><div style={formGrid}>
      <label className="roster-label">الموظف<select style={field} required disabled={Boolean(editing)} value={form.employee_id} onChange={e => update("employee_id", e.target.value)}><option value="">اختر موظفًا</option>{employees.map(e => <option key={e.id} value={e.id}>{e.employee_number} — {e.first_name} {e.last_name}</option>)}</select></label>
      <label className="roster-label">التاريخ<input type="date" style={field} required disabled={Boolean(editing)} value={form.work_date} onChange={e => update("work_date", e.target.value)} /></label>
      <label className="roster-label">الحالة<select style={field} value={form.status} onChange={e => update("status", e.target.value)}>{Object.entries(statuses).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      {form.status === "scheduled" && <><label className="roster-label">الوردية<select style={field} required disabled={!shifts.length} value={form.shift_id} onChange={e => { const selected = shifts.find(s => String(s.id) === e.target.value); setForm(previous => ({ ...previous, shift_id: e.target.value, planned_start: selected?.start_time?.slice(0, 5) || "", planned_end: selected?.end_time?.slice(0, 5) || "" })); }}><option value="">{shifts.length ? "اختر وردية" : "أنشئ نوع وردية أولًا"}</option>{shifts.filter(s => s.is_active !== false || String(s.id) === form.shift_id).map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)})</option>)}</select></label>
        <label className="roster-label">بداية الدوام<input type="time" style={field} value={form.planned_start} onChange={e => update("planned_start", e.target.value)} /></label>
        <label className="roster-label">نهاية الدوام<input type="time" style={field} value={form.planned_end} onChange={e => update("planned_end", e.target.value)} /></label></>}
      <label className="roster-label">ملاحظات<input style={field} maxLength={1000} value={form.notes} onChange={e => update("notes", e.target.value)} /></label>
    </div><div className="att-actions"><button className="roster-btn primary" disabled={busy || (form.status === "scheduled" && !form.shift_id)} type="submit"><Save size={16} /> {editing ? "حفظ التعديل" : "إضافة للجدول"}</button><button className="roster-btn" type="button" onClick={() => setShowForm(false)}><X size={16} /> إلغاء</button></div></form>}
    <article className="pv2-panel"><h2>جدول {month}</h2>{!rows.length && <p>لا توجد ورديات لهذا الشهر.</p>}{rows.map(item => <div className="att-row" key={item.id}><b>{item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : "—"}</b><span>{item.work_date?.slice(0, 10)}</span><span>{item.shift?.name || "—"}</span><span>{item.status === "scheduled" ? `${item.planned_start?.slice(0, 5) || item.shift?.start_time?.slice(0, 5) || "—"} – ${item.planned_end?.slice(0, 5) || item.shift?.end_time?.slice(0, 5) || "—"}` : "—"}</span><span className="att-actions"><span>{statuses[item.status] || item.status}</span><button className="roster-btn" type="button" disabled={busy} title="تعديل" onClick={() => startEdit(item)}><Pencil size={16} /></button><button className="roster-btn danger" type="button" disabled={busy} title="حذف" onClick={() => remove(item)}><Trash2 size={16} /></button></span></div>)}
      {lastPage > 1 && <div className="att-actions" style={{ marginTop: 14, alignItems: "center" }}><button className="roster-btn" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</button><span>صفحة {page} من {lastPage}</span><button className="roster-btn" type="button" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>التالي</button></div>}
    </article>
  </section>;
}
