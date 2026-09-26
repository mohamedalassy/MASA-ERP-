import { useCallback, useEffect, useState } from "react";
import { Fingerprint, Clock3, UserX, TriangleAlert, Timer, RefreshCw, Plus, CalendarDays, Download } from "lucide-react";
import { hrApi, hrDownload } from "./hrApi";
import "./hr-v2.css";
import "./hr-v2-stage2.css";

const today = () => new Date().toLocaleDateString("en-CA");
const attendanceTime = value => value ? new Date(value).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Riyadh" }) : "—";
const statusLabel = { present: "حاضر", late: "متأخر", absent: "غائب", incomplete: "سجل ناقص", leave: "إجازة", on_leave: "إجازة" };
export default function AttendanceCommandCenter({ onNavigate }) {
  const [date, setDate] = useState(() => sessionStorage.getItem("masa-attendance-date") || today());
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    setError("");
    return hrApi(`/hr/v2/attendance/command-center?date=${encodeURIComponent(date)}`)
      .then(setData).catch(e => setError(e.message));
  }, [date]);
  useEffect(() => { load(); }, [load]);
  const calculateDay = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await hrApi("/hr/v2/attendance/rebuild-day", { method: "POST", body: JSON.stringify({ date }) });
      await load();
      setNotice(`تم حساب ${result.processed} موظف: ${result.absent} غياب، ${result.present} حضور، ${result.incomplete} سجلات ناقصة، ${result.leave} إجازات.`);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const downloadDay = async () => {
    setBusy(true); setError("");
    try { await hrDownload(`/hr/v2/attendance/export-day?date=${encodeURIComponent(date)}`, `MASA-Attendance-${date}.csv`); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const open = kind => {
    sessionStorage.setItem("masa-attendance-date", date);
    onNavigate?.(`hr-v2-attendance-${kind}`);
  };
  const cards = [
    ["الحضور", data?.kpis?.present ?? 0, Fingerprint, "present"],
    ["المتأخرون", data?.kpis?.late ?? 0, Clock3, "late"],
    ["الغياب", data?.kpis?.absent ?? 0, UserX, "absent"],
    ["الإجازات", data?.kpis?.leave ?? 0, CalendarDays, "leave"],
    ["سجلات ناقصة", data?.kpis?.incomplete ?? 0, TriangleAlert, "incomplete"],
    ["إضافي/دقيقة", data?.kpis?.overtime_minutes ?? 0, Timer, "overtime"],
    ["أجهزة Online", `${data?.devices?.online ?? 0}/${data?.devices?.total ?? 0}`, Fingerprint, "devices"],
  ];
  return <section className="pv2-page" dir="rtl">
    <header className="pv2-hero"><div><small>TIME & ATTENDANCE</small><h1>مركز الحضور والبصمة</h1><p>تشغيل الحضور والاستثناءات والأجهزة من مركز واحد.</p></div>
      <div className="att-actions"><input type="date" value={date} onChange={e => { setDate(e.target.value); setNotice(""); }} /><button type="button" onClick={load}><RefreshCw size={16} /> تحديث</button><button type="button" disabled={busy || !date || date >= today()} onClick={calculateDay}><CalendarDays size={16} /> حساب يوم سابق</button><button type="button" disabled={busy || !date} onClick={downloadDay}><Download size={16} /> تنزيل تقرير اليوم</button><button type="button" onClick={() => onNavigate?.("hr-v2-attendance-devices")}><Plus size={16} /> إضافة جهاز بصمة</button></div>
    </header>
    {error && <div className="pv2-error">{error}</div>}
    {notice && <div className="pv2-panel" role="status" style={{ marginBottom: 14, color: "#187449" }}>{notice}</div>}
    <div className="pv2-kpis">{cards.map(([label, value, Icon, kind]) => <button type="button" key={kind} onClick={() => open(kind)} title={`فتح صفحة ${label}`}><Icon /><small>{label}</small><strong>{value}</strong></button>)}</div>
    <div className="att-pending">{[["تصحيحات معلقة",data?.pending?.corrections],["إضافي معلق",data?.pending?.overtime],["إجازات معلقة",data?.pending?.leaves]].map(([label,count]) => <button type="button" key={label} onClick={() => onNavigate?.("hr-v2-attendance-requests")}>{label} <b>{count ?? 0}</b></button>)}</div>
    <article className="pv2-panel"><h2>سجلات اليوم</h2>{(data?.rows || []).map(row => <div className="att-row" key={row.id}><b>{row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : "—"}</b><span>دخول: {attendanceTime(row.first_in)}</span><span>خروج: {attendanceTime(row.last_out)}</span><span>{row.worked_minutes ?? 0} د</span><span className={`status ${row.status}`}>{statusLabel[row.status] || row.status || "—"}</span></div>)}</article>
  </section>;
}
