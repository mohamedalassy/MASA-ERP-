import { useCallback, useEffect, useState } from "react";
import { WalletCards, Plus, Calculator, CheckCircle2, RefreshCw, Send, FileCheck2, Eye, X, Download } from "lucide-react";
import { hrGet, hrPost, hrDownload } from "./hrApi";
import "./hr-v2.css";
import "./hr-v2-stage3.css";

const money = value => Number(value || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PayrollCommandCenter() {
  const [runs, setRuns] = useState([]);
  const [summary, setSummary] = useState({});
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, branch_id: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [wpsCheck, setWpsCheck] = useState(null);

  const load = useCallback(async () => {
    try {
      setErr("");
      const response = await hrGet("/hr/v2/payroll/runs");
      setRuns(response.data || []);
      setSummary(response.summary || {});
    } catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function viewRun(id) {
    try {
      setDetailBusy(true); setErr("");
      const response = await hrGet(`/hr/v2/payroll/runs/${id}`);
      setDetail(response.data || response);
    } catch (e) { setErr(e.message); }
    finally { setDetailBusy(false); }
  }
  async function act(id, action, data = {}) {
    try {
      setBusy(`${id}-${action}`); setErr(""); setNotice("");
      const response = await hrPost(`/hr/v2/payroll/runs/${id}/${action}`, data);
      if (action === "wps/validate") setWpsCheck({ id, ...response.data });
      else setWpsCheck(null);
      setNotice(response.message || "تم تنفيذ الإجراء بنجاح.");
      await load();
      if (detail?.id === id) await viewRun(id);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }
  async function downloadWps(run) {
    try {
      setBusy(`${run.id}-download`); setErr("");
      await hrDownload(`/hr/v2/payroll/runs/${run.id}/wps/download`, `WPS-${run.period_year}-${String(run.period_month).padStart(2, "0")}.csv`);
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }
  async function create() {
    try {
      setBusy("create"); setErr("");
      await hrPost("/hr/v2/payroll/runs", { year: Number(form.year), month: Number(form.month), branch_id: form.branch_id ? Number(form.branch_id) : null });
      setOpen(false); await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(""); }
  }

  return <section className="pv2-page" dir="rtl">
    <style>{`.payroll-run-list .pay-row{grid-template-columns:minmax(130px,1.6fr) repeat(4,minmax(80px,1fr)) minmax(190px,1.5fr)}.payroll-run-list .pay-actions{display:flex;gap:5px;flex-wrap:wrap}.payroll-run-list .pay-actions button{border:1px solid #dfdcef;border-radius:9px;background:#f7f5ff;color:#392f79;padding:7px;cursor:pointer}.payroll-run-detail{margin-top:16px}.payroll-run-detail .table-wrap{width:100%;overflow-x:auto;margin-top:16px}.payroll-run-detail table{width:100%;min-width:1250px;border-collapse:collapse;text-align:right;table-layout:auto}.payroll-run-detail th,.payroll-run-detail td{border-bottom:1px solid #e9e7f4;padding:13px 11px;white-space:nowrap;font-size:14px;line-height:1.5;color:#252946}.payroll-run-detail th{background:#f5f3ff;color:#392f79;font-weight:700}.payroll-run-detail td b{font-size:14px}.payroll-run-detail td small{font-size:12px;color:#727b97}.payroll-run-detail td.negative{color:#bd3d52}.payroll-run-detail td.positive{color:#187449}@media(max-width:850px){.payroll-run-list .pay-row{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
    <header className="pv2-hero"><div><small>PAYROLL & COMPENSATION</small><h1>Payroll Command Center</h1><p>الحساب، المراجعة، الاعتماد، الترحيل وWPS من تشغيل رواتب واحد.</p></div><button type="button" onClick={() => setOpen(!open)}><Plus size={16} /> تشغيل رواتب</button></header>
    {err && <div className="pv2-error" role="alert">{err}</div>}
    {notice && <div className="pv2-panel" role="status" style={{ marginBottom: 12, color: "#187449" }}>{notice}</div>}
    {wpsCheck && <div className="pv2-panel" style={{ marginBottom: 12 }}><h2>نتيجة فحص WPS للمسير {runs.find(run => run.id === wpsCheck.id)?.run_number}</h2><p>{wpsCheck.checked_count} موظف — {wpsCheck.is_valid ? "جاهز للتوليد" : "يلزم تصحيح الأخطاء قبل التوليد"}</p>{wpsCheck.errors?.map((message, index) => <p key={`error-${index}`} style={{ color: "#bd3d52" }}>{message}</p>)}{wpsCheck.warnings?.map((message, index) => <p key={`warning-${index}`} style={{ color: "#8b6500" }}>{message}</p>)}</div>}
    {open && <div className="pay-form"><input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /><select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>{Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select><input placeholder="Branch ID اختياري" value={form.branch_id} onChange={e => setForm({ ...form, branch_id: e.target.value })} /><button type="button" disabled={Boolean(busy)} onClick={create}>حساب وإنشاء</button></div>}
    <div className="pay-summary"><div><WalletCards /><small>الدورات</small><b>{summary.runs_count ?? runs.length}</b></div><div><Calculator /><small>بانتظار الإجراء</small><b>{runs.filter(x => ["calculated", "approved"].includes(x.status)).length}</b></div><div><CheckCircle2 /><small>مرحّلة</small><b>{summary.posted_count ?? 0}</b></div></div>
    <article className="pv2-panel payroll-run-list"><h2>دورات الرواتب</h2>{runs.map(run => <div className="pay-row" key={run.id}>
      <div><b>{run.run_number}</b><small>{String(run.period_month).padStart(2, "0")}/{run.period_year}</small></div>
      <span>{run.employees_count} موظف</span><span>{Number(run.total_gross || 0).toLocaleString()} SAR</span><span>{Number(run.total_net || 0).toLocaleString()} SAR</span><span className={`status ${run.status}`}>{run.status}</span>
      <div className="pay-actions">
        <button type="button" disabled={detailBusy} onClick={() => viewRun(run.id)} title="تفاصيل المسير" aria-label="تفاصيل المسير"><Eye size={15} /></button>
        {run.status === "calculated" && <><button type="button" disabled={Boolean(busy)} onClick={() => act(run.id, "recalculate")} title="إعادة الحساب"><RefreshCw size={15} /></button><button type="button" disabled={Boolean(busy)} onClick={() => act(run.id, "approve")} title="اعتماد"><CheckCircle2 size={15} /></button></>}
        {run.status === "approved" && <><button type="button" disabled={Boolean(busy)} onClick={() => act(run.id, "post")} title="ترحيل للمالية"><Send size={15} /></button><button type="button" disabled={Boolean(busy)} onClick={() => act(run.id, "wps/validate")} title="فحص WPS"><FileCheck2 size={15} /></button></>}
        {["approved", "posted"].includes(run.status) && <button type="button" disabled={Boolean(busy)} onClick={() => act(run.id, "wps/generate")} title="توليد WPS">WPS</button>}
        {run.wps_file_path && <button type="button" disabled={Boolean(busy)} onClick={() => downloadWps(run)} title="تنزيل ملف WPS" aria-label={`تنزيل WPS للمسير ${run.run_number}`}><Download size={15} /> تنزيل</button>}
      </div>
    </div>)}</article>
    {detail && <article className="pv2-panel payroll-run-detail"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}><div><h2>تفاصيل المسير {detail.run_number}</h2><small>مراجعة الحضور والخصومات والإضافي قبل الاعتماد</small></div><button type="button" onClick={() => setDetail(null)} aria-label="إغلاق التفاصيل"><X size={18} /></button></div>
      <div className="table-wrap"><table><thead><tr><th>الموظف</th><th>الأساسي</th><th>البدلات</th><th>غياب</th><th>خصم الغياب</th><th>خصم التأخير</th><th>إضافي</th><th>خصم التأمينات</th><th>الإجمالي</th><th>الصافي</th></tr></thead><tbody>{(detail.lines || []).map(line => <tr key={line.id}><td><b>{line.employee_name}</b><br /><small>{line.employee_number}</small></td><td>{money(line.basic_salary)}</td><td>{money(line.allowances)}</td><td>{Number(line.absent_days || 0)}</td><td className="negative">{money(line.absence_deduction)}</td><td className="negative">{money(line.late_deduction)}</td><td className="positive">{money(line.overtime_amount)}</td><td className="negative">{money(line.gosi_deduction)}</td><td>{money(line.gross_salary)}</td><td><b>{money(line.net_salary)} ر.س</b></td></tr>)}</tbody></table></div>
      {!detail.lines?.length && <p>لا توجد بنود في هذا المسير.</p>}
    </article>}
  </section>;
}
