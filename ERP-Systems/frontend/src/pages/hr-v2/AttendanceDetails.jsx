import { useCallback, useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { hrApi } from "./hrApi";
import "./hr-v2.css";
import "./hr-v2-stage2.css";

const names = { present: "الحضور", late: "المتأخرون", absent: "الغياب", leave: "الإجازات", incomplete: "سجلات ناقصة", overtime: "العمل الإضافي" };
const statusLabel = { present: "حاضر", late: "متأخر", absent: "غائب", incomplete: "سجل ناقص", leave: "إجازة", on_leave: "إجازة" };
const matches = {
  present: row => ["present", "late"].includes(row.status),
  late: row => Number(row.late_minutes) > 0,
  absent: row => row.status === "absent",
  leave: row => ["leave", "on_leave"].includes(row.status),
  incomplete: row => row.status === "incomplete",
  overtime: row => Number(row.overtime_minutes) > 0,
};
export default function AttendanceDetails({ kind, onNavigate }) {
  const [date, setDate] = useState(() => sessionStorage.getItem("masa-attendance-date") || new Date().toLocaleDateString("en-CA"));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    setError("");
    sessionStorage.setItem("masa-attendance-date", date);
    hrApi(`/hr/v2/attendance/command-center?date=${encodeURIComponent(date)}&detail=${kind}`)
      .then(setData).catch(e => setError(e.message));
  }, [date, kind]);
  useEffect(() => { load(); }, [load]);
  const rows = (data?.rows || []).filter(matches[kind] || (() => false));
  return <section className="pv2-page" dir="rtl">
    <header className="pv2-hero"><div><small>TIME & ATTENDANCE</small><h1>{names[kind]}</h1><p>سجلات الحضور بتاريخ {date}</p></div><div className="att-actions"><button type="button" onClick={() => onNavigate?.("hr-v2-attendance")}><ArrowRight size={16} /> العودة للمركز</button><input type="date" value={date} onChange={e => setDate(e.target.value)} /><button type="button" onClick={load}><RefreshCw size={16} /> تحديث</button></div></header>
    {error && <div className="pv2-error">{error}</div>}
    <article className="pv2-panel"><h2>{names[kind]} ({rows.length})</h2>{!rows.length && <p>لا توجد سجلات لهذا التصنيف في التاريخ المحدد.</p>}
      {rows.map(row => <div className="att-row" key={row.id}><b>{row.employee ? `${row.employee.first_name} ${row.employee.last_name}` : "—"}</b><span>{row.employee?.employee_number || "—"}</span><span>تأخير: {row.late_minutes ?? 0} د</span><span>إضافي: {row.overtime_minutes ?? 0} د</span><span className={`status ${row.status}`}>{statusLabel[row.status] || row.status || "—"}</span></div>)}
    </article>
  </section>;
}
