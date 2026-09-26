import { useCallback, useEffect, useState } from "react";
import { Check, Plus, RefreshCw, X } from "lucide-react";
import { hrGet, hrPost } from "./hrApi";
import "./hr-v2.css";
import "./hr-v2-stage2.css";

const tabs = [["corrections", "تصحيح الحضور"], ["overtime", "العمل الإضافي"], ["leaves", "الإجازات"]];
const today = () => new Date().toLocaleDateString("en-CA");
const initial = () => ({ employee_id: "", work_date: today(), requested_check_in: "", requested_check_out: "", reason: "" });
const initialOvertime = () => ({ employee_id: "", work_date: today(), requested_minutes: "", reason: "" });
const initialLeave = () => ({ employee_id: "", leave_type: "annual", start_date: today(), end_date: today(), reason: "" });
const leaveTypes = { annual: "سنوية", sick: "مرضية", emergency: "طارئة", unpaid: "بدون راتب", other: "أخرى" };
const dateTime = value => value ? `${value.replace("T", " ")}:00` : null;
const shortDate = value => typeof value === "string" ? value.slice(0, 10) : "—";
const riyadhToday = () => { const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(part => [part.type, part.value])); return `${parts.year}-${parts.month}-${parts.day}`; };
const recordedTime = value => value ? new Date(value).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }) : "—";
const fieldStyle = { width: "100%", boxSizing: "border-box", border: "1px solid #dfe3ef", borderRadius: 10, padding: "10px 12px", font: "inherit" };
const formStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 18 };
const reviewButton = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid", borderRadius: 9, padding: "8px 12px", font: "inherit", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" };

export default function AttendanceRequests({ onNavigate }) {
  const [tab, setTab] = useState("corrections");
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(initial);
  const [overtimeForm, setOvertimeForm] = useState(initialOvertime);
  const [leaveForm, setLeaveForm] = useState(initialLeave);
  const [summaryEmployee, setSummaryEmployee] = useState("");
  const [summaryYear, setSummaryYear] = useState(() => Number(today().slice(0, 4)));
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [annualDays, setAnnualDays] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setErr("");
    try {
      const path = tab === "leaves" ? "/hr/v2/leaves" : `/hr/v2/attendance/${tab}`;
      const result = await hrGet(`${path}?per_page=100`);
      setRows(Array.isArray(result.data) ? result.data : result.data?.data || []);
    } catch (e) { setErr(e.message); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (tab !== "leaves") return;
    hrGet("/hr/employees?per_page=100").then(result => {
      setEmployees(Array.isArray(result.data) ? result.data : result.data?.data || []);
    }).catch(e => setErr(e.message));
  }, [tab]);
  useEffect(() => {
    if (tab !== "leaves" || !summaryEmployee || !summaryYear || Number(summaryYear) < 2000 || Number(summaryYear) > 2100) { setLeaveSummary(null); setAnnualDays(""); return; }
    let active = true;
    hrGet(`/hr/v2/leaves/summary?employee_id=${encodeURIComponent(summaryEmployee)}&year=${summaryYear}`)
      .then(result => { if (active) { setLeaveSummary(result); setAnnualDays(result.annual_entitlement == null ? "" : String(result.annual_entitlement)); } })
      .catch(e => { if (active) { setLeaveSummary(null); setErr(e.message); } });
    return () => { active = false; };
  }, [tab, summaryEmployee, summaryYear, rows]);
  useEffect(() => {
    if (!showForm && !showOvertimeForm && !showLeaveForm) return;
    hrGet("/hr/employees?per_page=100").then(result => {
      setEmployees(Array.isArray(result.data) ? result.data : result.data?.data || []);
    }).catch(e => setErr(e.message));
  }, [showForm, showOvertimeForm, showLeaveForm]);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setErr(""); setNotice("");
    try {
      await hrPost("/hr/v2/attendance/corrections", {
        employee_id: Number(form.employee_id), work_date: form.work_date,
        requested_check_in: dateTime(form.requested_check_in),
        requested_check_out: dateTime(form.requested_check_out), reason: form.reason.trim(),
      });
      setNotice("تم إنشاء طلب التصحيح. راجعه واعتمده لتحديث حضور الموظف.");
      setShowForm(false); setForm(initial()); setTab("corrections"); await load();
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function submitOvertime(event) {
    event.preventDefault(); setBusy(true); setErr(""); setNotice("");
    try {
      await hrPost("/hr/v2/attendance/overtime", {
        employee_id: Number(overtimeForm.employee_id), work_date: overtimeForm.work_date,
        requested_minutes: Number(overtimeForm.requested_minutes), reason: overtimeForm.reason.trim(),
      });
      setNotice("تم إنشاء طلب العمل الإضافي، وهو الآن بانتظار المراجعة.");
      setShowOvertimeForm(false); setOvertimeForm(initialOvertime()); setTab("overtime");
      const result = await hrGet("/hr/v2/attendance/overtime?per_page=100");
      setRows(Array.isArray(result.data) ? result.data : result.data?.data || []);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function submitLeave(event) {
    event.preventDefault(); setBusy(true); setErr(""); setNotice("");
    try {
      await hrPost("/hr/v2/leaves", { ...leaveForm, employee_id: Number(leaveForm.employee_id), reason: leaveForm.reason.trim() });
      setNotice("تم إنشاء طلب الإجازة، وهو الآن بانتظار المراجعة.");
      setShowLeaveForm(false); setLeaveForm(initialLeave()); setTab("leaves");
      const result = await hrGet("/hr/v2/leaves?per_page=100");
      setRows(Array.isArray(result.data) ? result.data : result.data?.data || []);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function saveEntitlement(event) {
    event.preventDefault(); setBusy(true); setErr(""); setNotice("");
    try {
      await hrPost("/hr/v2/leaves/entitlement", { employee_id: Number(summaryEmployee), year: Number(summaryYear), annual_days: Number(annualDays) });
      const result = await hrGet(`/hr/v2/leaves/summary?employee_id=${encodeURIComponent(summaryEmployee)}&year=${summaryYear}`);
      setLeaveSummary(result); setNotice("تم حفظ استحقاق الإجازة السنوية.");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function review(item, action) {
    if (!window.confirm(action === "approve" ? "اعتماد الطلب وتحديث سجل الحضور؟" : "رفض الطلب؟")) return;
    setBusy(true); setErr(""); setNotice("");
    try {
      const path = tab === "leaves" ? `/hr/v2/leaves/${item.id}/review` : `/hr/v2/attendance/${tab}/${item.id}/review`;
      await hrPost(path, { action }); await load();
      setNotice(action === "approve" ? "تم اعتماد الطلب." : "تم رفض الطلب.");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  async function cancelLeave(item) {
    if (!window.confirm(item.status === "approved" ? "إلغاء الإجازة المعتمدة وإرجاع أيامها للرصيد؟" : "إلغاء طلب الإجازة المعلق؟")) return;
    setBusy(true); setErr(""); setNotice("");
    try {
      await hrPost(`/hr/v2/leaves/${item.id}/cancel`);
      await load();
      setNotice("تم إلغاء الإجازة وتحديث رصيد الأيام المعتمدة.");
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  const update = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const updateOvertime = (key, value) => setOvertimeForm(previous => ({ ...previous, [key]: value }));
  const updateLeave = (key, value) => setLeaveForm(previous => ({ ...previous, [key]: value }));
  const showNew = kind => { setTab(kind); setShowForm(kind === "corrections"); setShowOvertimeForm(kind === "overtime"); setShowLeaveForm(kind === "leaves"); };
  return <section className="pv2-page" dir="rtl">
    <header className="pv2-hero"><div><small>REQUESTS & EXCEPTIONS</small><h1>طلبات الحضور والإجازات</h1><p>إنشاء ومراجعة تصحيحات الحضور والإضافي والإجازات.</p></div>
      <div className="att-actions"><button type="button" onClick={() => onNavigate?.("hr-v2-attendance")}>مركز الحضور</button><button type="button" onClick={() => showNew("corrections")}><Plus size={16} /> طلب تصحيح حضور</button><button type="button" onClick={() => showNew("overtime")}><Plus size={16} /> طلب عمل إضافي</button><button type="button" onClick={() => showNew("leaves")}><Plus size={16} /> طلب إجازة</button></div>
    </header>
    {err && <div className="pv2-error" role="alert">{err}</div>}
    {notice && <div className="pv2-panel" role="status" style={{ marginBottom: 12, color: "#187449" }}>{notice}</div>}
    {showForm && <form className="pv2-panel" onSubmit={submit} style={{ marginBottom: 16 }}><h2>طلب تصحيح حضور</h2><div style={formStyle}>
      <label>الموظف<select required style={fieldStyle} value={form.employee_id} onChange={e => update("employee_id", e.target.value)}><option value="">اختر موظفًا</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.employee_number} — {employee.first_name} {employee.last_name}</option>)}</select></label>
      <label>تاريخ الحضور<input required type="date" style={fieldStyle} value={form.work_date} onChange={e => update("work_date", e.target.value)} /></label>
      <label>وقت الدخول<input type="datetime-local" style={fieldStyle} value={form.requested_check_in} onChange={e => update("requested_check_in", e.target.value)} /></label>
      <label>وقت الخروج<input type="datetime-local" style={fieldStyle} value={form.requested_check_out} onChange={e => update("requested_check_out", e.target.value)} /></label>
      <label style={{ gridColumn: "1/-1" }}>سبب التصحيح<input required maxLength={1000} style={fieldStyle} value={form.reason} onChange={e => update("reason", e.target.value)} placeholder="مثلًا: نسيان تسجيل الدخول" /></label>
    </div><div className="att-actions"><button type="submit" disabled={busy || (!form.requested_check_in && !form.requested_check_out)}>إرسال للمراجعة</button><button type="button" onClick={() => setShowForm(false)}>إلغاء</button></div></form>}
    {showOvertimeForm && <form className="pv2-panel" onSubmit={submitOvertime} style={{ marginBottom: 16 }}><h2>طلب عمل إضافي</h2><div style={formStyle}>
      <label>الموظف<select required style={fieldStyle} value={overtimeForm.employee_id} onChange={e => updateOvertime("employee_id", e.target.value)}><option value="">اختر موظفًا</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.employee_number} — {employee.first_name} {employee.last_name}</option>)}</select></label>
      <label>تاريخ العمل<input required type="date" style={fieldStyle} value={overtimeForm.work_date} onChange={e => updateOvertime("work_date", e.target.value)} /></label>
      <label>عدد الدقائق المطلوبة<input required type="number" min="1" max="1440" step="1" style={fieldStyle} value={overtimeForm.requested_minutes} onChange={e => updateOvertime("requested_minutes", e.target.value)} placeholder="مثال: 120" /></label>
      <label style={{ gridColumn: "1/-1" }}>السبب<input required maxLength={1000} style={fieldStyle} value={overtimeForm.reason} onChange={e => updateOvertime("reason", e.target.value)} placeholder="سبب العمل الإضافي" /></label>
    </div><div className="att-actions"><button type="submit" disabled={busy}>إرسال للمراجعة</button><button type="button" onClick={() => setShowOvertimeForm(false)}>إلغاء</button></div></form>}
    {showLeaveForm && <form className="pv2-panel" onSubmit={submitLeave} style={{ marginBottom: 16 }}><h2>طلب إجازة</h2><div style={formStyle}>
      <label>الموظف<select required style={fieldStyle} value={leaveForm.employee_id} onChange={e => updateLeave("employee_id", e.target.value)}><option value="">اختر موظفًا</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.employee_number} — {employee.first_name} {employee.last_name}</option>)}</select></label>
      <label>نوع الإجازة<select required style={fieldStyle} value={leaveForm.leave_type} onChange={e => updateLeave("leave_type", e.target.value)}>{Object.entries(leaveTypes).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
      <label>من تاريخ<input required type="date" style={fieldStyle} value={leaveForm.start_date} onChange={e => updateLeave("start_date", e.target.value)} /></label>
      <label>إلى تاريخ<input required type="date" min={leaveForm.start_date} style={fieldStyle} value={leaveForm.end_date} onChange={e => updateLeave("end_date", e.target.value)} /></label>
      <label style={{ gridColumn: "1/-1" }}>السبب<input required maxLength={1000} style={fieldStyle} value={leaveForm.reason} onChange={e => updateLeave("reason", e.target.value)} placeholder="سبب الإجازة" /></label>
    </div>{leaveForm.leave_type === "annual" && <p>قبل اعتماد الإجازة السنوية، حدّد استحقاق الموظف في تبويب الإجازات لكل سنة يشملها الطلب. لن يتم الاعتماد إذا تجاوزت الأيام المتبقية.</p>}<div className="att-actions"><button type="submit" disabled={busy}>إرسال للمراجعة</button><button type="button" onClick={() => setShowLeaveForm(false)}>إلغاء</button></div></form>}
    <div className="att-tabs">{tabs.map(([id, name]) => <button type="button" className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}>{name}</button>)}<button type="button" onClick={load}><RefreshCw size={15} /> تحديث</button></div>
    {tab === "leaves" && <div className="pv2-panel" style={{ marginBottom: 16 }}><h2>الأيام المعتمدة حسب نوع الإجازة</h2><div style={formStyle}>
      <label>الموظف<select style={fieldStyle} value={summaryEmployee} onChange={e => setSummaryEmployee(e.target.value)}><option value="">اختر موظفًا لعرض ملخصه</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.employee_number} — {employee.first_name} {employee.last_name}</option>)}</select></label>
      <label>السنة<input type="number" min="2000" max="2100" style={fieldStyle} value={summaryYear} onChange={e => setSummaryYear(e.target.value)} /></label>
    </div>{leaveSummary && <><div className="att-pending">{Object.entries(leaveTypes).map(([type, name]) => <span key={type}>{name} <b>{leaveSummary.approved_days?.[type] ?? 0} يوم</b></span>)}
      <span>المتبقي من السنوية <b>{leaveSummary.annual_remaining == null ? "لم يُحدد" : `${leaveSummary.annual_remaining} يوم`}</b></span></div>
      <form onSubmit={saveEntitlement} className="att-actions" style={{ alignItems: "end", marginBottom: 12 }}>
        <label>استحقاق السنوية لهذه السنة<input type="number" min="0" max="365" required style={fieldStyle} value={annualDays} onChange={e => setAnnualDays(e.target.value)} placeholder="أدخل عدد الأيام" /></label>
        <button type="submit" disabled={busy}>حفظ الاستحقاق</button>
      </form></>}
      <small>المتبقي = استحقاق السنة − أيام الإجازات السنوية المعتمدة خلال السنة. تُعرض الأنواع الأخرى بصورة مستقلة، ولا يُحتسب ترحيل من سنوات سابقة.</small>
    </div>}
    <article className="pv2-panel">{!rows.length && <p>لا توجد طلبات في هذا القسم.</p>}{rows.map(item => <div className="att-row" key={item.id}>
      <b>{item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : "—"}</b><span>{tab === "leaves" ? `${shortDate(item.start_date)} ← ${shortDate(item.end_date)}` : shortDate(item.work_date)}</span><span>{tab === "corrections" ? `دخول: ${recordedTime(item.requested_check_in)} · خروج: ${recordedTime(item.requested_check_out)}${item.reason ? ` · ${item.reason}` : ""}` : tab === "overtime" ? `المطلوب: ${item.requested_minutes} دقيقة${item.status === "approved" ? ` · المعتمد: ${item.approved_minutes} دقيقة` : ""}${item.reason ? ` · ${item.reason}` : ""}` : `${leaveTypes[item.leave_type] || item.leave_type} · ${item.days} يوم${item.reason ? ` · ${item.reason}` : ""}`}</span><span className={`status ${item.status}`}>{item.status === "pending" ? "بانتظار المراجعة" : item.status === "approved" ? "معتمد" : item.status === "rejected" ? "مرفوض" : item.status === "cancelled" ? "ملغي" : item.status}</span>
      <div className="att-actions">{item.status === "pending" && <><button type="button" disabled={busy} onClick={() => review(item, "approve")} title="اعتماد الطلب" style={{ ...reviewButton, color: "#187449", background: "#eaf8f0", borderColor: "#b5e6c7" }}><Check size={17} strokeWidth={2.5} /> اعتماد</button><button type="button" disabled={busy} onClick={() => review(item, "reject")} title="رفض الطلب" style={{ ...reviewButton, color: "#b42332", background: "#fff0f1", borderColor: "#f4c4ca" }}><X size={17} strokeWidth={2.5} /> رفض</button></>}{tab === "leaves" && (item.status === "pending" || (item.status === "approved" && shortDate(item.start_date) >= riyadhToday())) && <button type="button" disabled={busy} onClick={() => cancelLeave(item)} style={{ ...reviewButton, color: "#b42332", background: "#fff0f1", borderColor: "#f4c4ca" }}><X size={17} /> إلغاء الإجازة</button>}</div>
    </div>)}</article>
  </section>;
}
