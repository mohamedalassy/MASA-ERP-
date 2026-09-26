import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2, ChevronLeft, CircleAlert, Fingerprint, Link2, Plus,
  RefreshCw, Search, Server, Settings2, ShieldCheck, Wifi, WifiOff, X,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";
const BACKEND_BASE = API_BASE.replace(/\/api\/?$/, "");
const EMPTY = { branch_id: "", code: "", name: "", provider: "hikvision", model: "", serial_number: "", ip_address: "", port: 80, protocol: "http", username: "", password: "", timezone: "Asia/Riyadh", location: "", sync_interval_minutes: 5, auto_sync: true, is_active: true };
const PROVIDERS = { hikvision: "Hikvision", zkteco: "ZKTeco", suprema: "Suprema", dahua: "Dahua", other: "أخرى" };
function token() { return localStorage.getItem("token") || localStorage.getItem("auth_token") || ""; }
async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const method = (options.method || "GET").toUpperCase();
  const isWrite = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (isWrite) {
    const csrfResponse = await fetch(`${BACKEND_BASE}/sanctum/csrf-cookie`, {
      credentials: "include", headers: { Accept: "application/json" },
    });
    if (!csrfResponse.ok && csrfResponse.status !== 204) {
      throw new Error(`تعذر تهيئة حماية الطلب (${csrfResponse.status})`);
    }
  }
  const xsrf = document.cookie.split(";").map(item => item.trim())
    .find(item => item.startsWith("XSRF-TOKEN="));
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include", ...options,
    headers: { Accept: "application/json", ...(options.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(isWrite && xsrf ? { "X-XSRF-TOKEN": decodeURIComponent(xsrf.slice("XSRF-TOKEN=".length)) } : {}),
      ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validation = payload.errors ? Object.values(payload.errors).flat().join("، ") : "";
    throw new Error(validation || payload.message || `تعذر تنفيذ الطلب (${response.status})`);
  }
  return payload;
}
function rows(payload) { const page = payload?.data?.data && Array.isArray(payload.data.data) ? payload.data : payload; return Array.isArray(page) ? page : Array.isArray(page?.data) ? page.data : []; }

export default function HrAttendanceDevices({ onNavigate, peopleV2 = false }) {
  const [devices, setDevices] = useState([]); const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [search, setSearch] = useState("");
  const [provider, setProvider] = useState(""); const [showForm, setShowForm] = useState(false); const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false); const [formError, setFormError] = useState(""); const [testingId, setTestingId] = useState(null);
  const [importDevice, setImportDevice] = useState(null);
  const importSectionRef = useRef(null);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importBusy, setImportBusy] = useState(false);
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [biometricUserId, setBiometricUserId] = useState("");
  const [mappingBusy, setMappingBusy] = useState(false);
  const [mappingMessage, setMappingMessage] = useState("");
  const [mappingDeviceId, setMappingDeviceId] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const [deviceData, branchData] = await Promise.all([api("/hr/attendance-devices?per_page=100"), api("/hr/branches?per_page=100")]); setDevices(rows(deviceData)); setBranches(rows(branchData)); }
    catch (err) { setError(err.message || "تعذر تحميل أجهزة الحضور"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (importDevice) importSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [importDevice]);

  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return devices.filter((item) => (!provider || item.provider === provider) && (!q || `${item.name} ${item.code} ${item.serial_number || ""} ${item.ip_address || ""}`.toLowerCase().includes(q))); }, [devices, search, provider]);
  const stats = useMemo(() => ({ total: devices.length, online: devices.filter((item) => item.status === "online").length, offline: devices.filter((item) => item.status === "offline").length, auto: devices.filter((item) => item.auto_sync).length }), [devices]);

  async function save(event) {
    event.preventDefault(); setSaving(true); setFormError("");
    try { const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === "" ? null : value])); await api("/hr/attendance-devices", { method: "POST", body: JSON.stringify(body) }); setShowForm(false); setForm(EMPTY); await load(); }
    catch (err) { setFormError(err.message || "تعذر حفظ الجهاز"); } finally { setSaving(false); }
  }
  async function test(device) {
    setTestingId(device.id); setError("");
    try { await api(`/hr/attendance-devices/${device.id}/test-connection`, { method: "POST" }); await load(); }
    catch (err) { setError(`${device.name}: ${err.message}`); await load(); } finally { setTestingId(null); }
  }

  async function uploadPunches(event) {
    event.preventDefault();
    if (!importDevice || !importFile) return;
    setImportBusy(true); setImportResult(null); setError("");
    try {
      const form = new FormData();
      form.append("file", importFile);
      const result = await api(`/hr/v2/biometric/devices/${importDevice.id}/import`, { method: "POST", body: form });
      setImportResult(result.data);
      await load();
    } catch (err) { setError(err.message); }
    finally { setImportBusy(false); }
  }

  async function saveMapping(event) {
    event.preventDefault(); setMappingBusy(true); setMappingMessage(""); setError("");
    try {
      if (!mappingDeviceId) throw new Error("اختر الجهاز أولًا.");
      const result = await api(`/hr/employees?search=${encodeURIComponent(employeeNumber.trim())}&per_page=100`);
      const matches = rows(result).filter((person) => person.employee_number === employeeNumber.trim());
      if (matches.length !== 1) throw new Error("رقم الموظف غير موجود أو غير محدد بدقة.");
      await api(`/hr/v2/biometric/devices/${mappingDeviceId}/employees/${matches[0].id}/map`, {
        method: "PATCH", body: JSON.stringify({ biometric_user_id: biometricUserId.trim() }),
      });
      setMappingMessage(`تم ربط ${matches[0].first_name} ${matches[0].last_name} بمعرّف البصمة ${biometricUserId.trim()}.`);
      setEmployeeNumber(""); setBiometricUserId("");
    } catch (err) { setError(err.message); }
    finally { setMappingBusy(false); }
  }

  function downloadTemplate() {
    const csv = "biometric_user_id,event_at,event_type,event_uid\r\nUSER-001,2026-09-25 08:00:00,check_in,EVENT-001\r\nUSER-001,2026-09-25 17:00:00,check_out,EVENT-002\r\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "attendance-import-template.csv";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  const cards = [
    { label: "إجمالي الأجهزة", value: stats.total, icon: Server, tone: "blue", note: "كل أجهزة المنظومة" },
    { label: "متصلة الآن", value: stats.online, icon: Wifi, tone: "green", note: "جاهزة للمزامنة" },
    { label: "غير متصلة", value: stats.offline, icon: WifiOff, tone: "red", note: "تحتاج فحص الاتصال" },
    { label: "إعداد المزامنة", value: stats.auto, icon: RefreshCw, tone: "violet", note: "تحتاج موصل الجهاز للتشغيل التلقائي" },
  ];

  return <main className="hrad" dir="rtl"><style>{'/* Attendance device management inside MASA People */\n.hrad{padding:20px;color:#161c35;background:#f8f9ff;min-height:70vh}.hrad button,.hrad select{cursor:pointer}.hrad-header,.hrad-directory__head,.hrad-header>div:last-child,.hrad-device-info,.hrad-stats,.hrad-cards{display:flex;gap:14px;flex-wrap:wrap}.hrad-header,.hrad-directory__head{align-items:center;justify-content:space-between}.hrad-header{background:#202449;color:white;border-radius:20px;padding:28px;margin-bottom:18px}.hrad-header h1{margin:10px 0}.hrad-header p{margin:0;color:#e3e3f3}.hrad-header button,.hrad button{border:1px solid #dddfee;background:white;color:#252849;border-radius:9px;padding:9px 12px}.hrad .hrad-primary{background:#6549e8;color:white;border-color:#6549e8}.hrad-stats{margin:16px 0}.hrad-stat,.hrad-health,.hrad-directory{background:#fff;border:1px solid #e5e7f1;border-radius:16px;padding:18px}.hrad-stat{flex:1;min-width:165px;display:flex;gap:12px}.hrad-stat strong{display:block;font-size:24px}.hrad-stat small,.hrad-stat em{display:block;color:#747c98;font-style:normal}.hrad-health{display:flex;justify-content:space-between;gap:20px;margin-bottom:16px}.hrad-health p{margin:6px 0;color:#747c98}.hrad-health__score i{display:block;background:#e9e6f8;width:150px;height:8px;border-radius:8px}.hrad-health__score i b{display:block;background:#6549e8;height:100%;border-radius:8px}.hrad-directory__head{margin-bottom:16px}.hrad-directory__head>div:last-child{display:flex;gap:8px}.hrad-directory input,.hrad-directory select,.hrad-form-body input,.hrad-form-body select{border:1px solid #dfe1ed;border-radius:8px;padding:9px;width:100%;box-sizing:border-box}.hrad-directory__head label{display:flex;align-items:center;gap:8px}.hrad-cards>article,.hrad-empty{border:1px solid #e5e7f1;border-radius:14px;padding:18px;flex:1;min-width:250px}.hrad-cards article header,.hrad-cards article footer{display:flex;justify-content:space-between;gap:12px}.hrad-cards article h3{margin:5px 0}.hrad-device-info{margin:14px 0;color:#656d8a}.hrad-alert,.hrad-form-error{color:#a62d34;background:#fff0f1;padding:12px;border-radius:10px;margin:12px 0}.hrad-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center}.hrad-backdrop{position:absolute;inset:0;background:#13182b99;border:0!important;border-radius:0!important}.hrad-modal form{position:relative;z-index:1;background:#fff;border-radius:18px;padding:22px;width:min(720px,94vw);max-height:90vh;overflow:auto;box-shadow:0 15px 50px #1117}.hrad-modal form header,.hrad-modal form footer{display:flex;align-items:center;justify-content:space-between;gap:14px}.hrad-form-body{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.hrad-form-body label span{display:block;margin-bottom:5px}.hrad-spin{animation:hradspin 1s linear infinite}@keyframes hradspin{to{transform:rotate(360deg)}}@media(max-width:650px){.hrad-form-body{grid-template-columns:1fr}.hrad-health{flex-direction:column}}\n\n.hrad-directory form{display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin:14px 0}.hrad-directory form label{display:grid;gap:6px;min-width:180px;flex:1}.hrad-directory form button{min-height:38px}.hrad-directory p[role=status]{padding:12px;background:#f0f8f3;border-radius:8px;color:#245b3e}.hrad-directory ul{line-height:1.8}.hrad-cards footer button{white-space:nowrap}.hrad-cards footer{flex-wrap:wrap}\n'}</style>
    <header className="hrad-header"><div><button type="button" onClick={() => onNavigate?.(peopleV2 ? "hr-v2-attendance" : "hr-attendance")}><ChevronLeft size={17} /> الحضور والبصمة</button><h1>إدارة أجهزة الحضور</h1><p>إدارة الأجهزة وربط الموظفين واستيراد بصمات الحضور في الموارد البشرية.</p></div><div><button className="hrad-refresh" type="button" onClick={load}><RefreshCw size={18} className={loading ? "hrad-spin" : ""} /></button><button className="hrad-primary" type="button" onClick={() => setShowForm(true)}><Plus size={18} /> إضافة جهاز</button></div></header>
    {error && <div className="hrad-alert"><CircleAlert size={20} /><div><strong>تنبيه أجهزة الحضور</strong><span>{error}</span></div></div>}
    <section className="hrad-stats">{cards.map(({ label, value, icon: Icon, tone, note }) => <article className={`hrad-stat hrad-stat--${tone}`} key={label}><span><Icon size={22} /></span><div><small>{label}</small><strong>{loading ? "—" : value.toLocaleString("ar-SA")}</strong><em>{note}</em></div></article>)}</section>
    <section className="hrad-health"><div><span><ShieldCheck size={21} /></span><div><strong>MASA Attendance Gateway</strong><p>سجل الأجهزة واستورد الحركات بصيغة موحدة. يحتاج الاتصال المباشر موصلًا للموديل.</p></div></div><div className="hrad-health__score"><span>جاهزية الاتصال</span><strong>{stats.total ? Math.round((stats.online / stats.total) * 100) : 0}%</strong><i><b style={{ width: `${stats.total ? Math.round((stats.online / stats.total) * 100) : 0}%` }} /></i></div></section>
    <section className="hrad-directory"><div className="hrad-directory__head"><div><h2>الأجهزة المسجلة</h2><p>{filtered.length} جهاز ظاهر من أصل {devices.length}</p></div><div><label><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو IP أو Serial..." /></label><select value={provider} onChange={(e) => setProvider(e.target.value)}><option value="">كل الشركات</option>{Object.entries(PROVIDERS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
      <div className="hrad-cards">{!loading && filtered.length === 0 && <div className="hrad-empty"><Fingerprint size={42} /><strong>لا توجد أجهزة مسجلة</strong><span>أضف أول جهاز حضور لبدء المزامنة.</span><button className="hrad-primary" type="button" onClick={() => setShowForm(true)}><Plus size={17} /> إضافة جهاز</button></div>}{filtered.map((device) => <article key={device.id}><header><span className={`provider provider--${device.provider}`}><Fingerprint size={23} /></span><div><small>{PROVIDERS[device.provider] || device.provider}</small><h3>{device.name}</h3><p>{device.model || "الموديل غير محدد"}</p></div><b className={`status status--${device.status}`}><i />{device.status === "online" ? "متصل" : device.status === "maintenance" ? "صيانة" : device.status === "error" ? "خطأ" : "غير متصل"}</b></header><div className="hrad-device-info"><span><Server size={14} /> {device.ip_address || "بدون IP"}:{device.port}</span><span><Building2 size={14} /> {device.branch?.name || "بدون فرع"}</span><span><RefreshCw size={14} /> كل {device.sync_interval_minutes} دقائق</span><span><Settings2 size={14} /> {device.protocol?.toUpperCase()}</span></div><footer><span>{device.serial_number || device.code}</span><button type="button" onClick={() => test(device)} disabled={testingId === device.id}>{testingId === device.id ? <RefreshCw className="hrad-spin" size={15} /> : <Link2 size={15} />} اختبار الاتصال</button><button type="button" onClick={() => { setImportDevice(device); setImportFile(null); setImportResult(null); }}>استيراد البصمات</button></footer></article>)}</div>
    </section>
    <section className="hrad-directory" style={{ padding: 20, marginTop: 18 }}>
      <h2>ربط موظف برقم المستخدم على جهاز البصمة</h2>
      <form onSubmit={saveMapping} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        <select required value={mappingDeviceId} onChange={(event) => setMappingDeviceId(event.target.value)}><option value="">اختر الجهاز</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</select>
        <input required value={employeeNumber} onChange={(event) => setEmployeeNumber(event.target.value)} placeholder="رقم الموظف في الموارد البشرية" />
        <input required value={biometricUserId} onChange={(event) => setBiometricUserId(event.target.value)} placeholder="User ID على الجهاز" />
        <button disabled={mappingBusy} type="submit">{mappingBusy ? "جارٍ الربط..." : "ربط الموظف"}</button>
      </form>
      {mappingMessage && <p role="status">{mappingMessage}</p>}
    </section>
    {importDevice && <section ref={importSectionRef} className="hrad-directory" style={{ padding: 20, marginTop: 18 }}>
      <h2>استيراد بصمات {importDevice.name}</h2>
      <p>الوقت بتوقيت الجهاز ({importDevice.timezone}). كل صف يحتاج رقم مستخدم مربوط بموظف، ووقتًا ونوع حركة ومعرّفًا فريدًا للحركة.</p>
      <button type="button" onClick={downloadTemplate}>تنزيل نموذج CSV</button>
      <form onSubmit={uploadPunches} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
        <input required type="file" accept=".csv,.txt" onChange={(event) => setImportFile(event.target.files?.[0] || null)} />
        <button type="submit" disabled={importBusy}>{importBusy ? "جارٍ الاستيراد..." : "استيراد السجلات"}</button>
        <button type="button" onClick={() => setImportDevice(null)}>إغلاق</button>
      </form>
      {importResult && <div role="status"><p>تم استقبال {importResult.received} سجل؛ أُضيف {importResult.created}، مكرر {importResult.duplicates}، أخطاء {importResult.failed}.</p>
        {!!importResult.errors?.length && <ul>{importResult.errors.map((item, index) => <li key={index}>{item}</li>)}</ul>}
      </div>}
    </section>}
    {showForm && <div className="hrad-modal"><button className="hrad-backdrop" type="button" onClick={() => !saving && setShowForm(false)} /><form onSubmit={save}><header><div><span><Fingerprint size={21} /></span><div><h2>إضافة جهاز حضور</h2><p>سجّل بيانات الشبكة والاتصال الخاصة بالجهاز.</p></div></div><button type="button" onClick={() => setShowForm(false)}><X size={19} /></button></header>{formError && <div className="hrad-form-error"><CircleAlert size={17} /> {formError}</div>}<div className="hrad-form-body"><label><span>كود الجهاز *</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ATT-001" /></label><label><span>اسم الجهاز *</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label><span>الشركة المصنعة *</span><select required value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>{Object.entries(PROVIDERS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><span>الموديل</span><input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></label><label><span>الفرع</span><select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}><option value="">اختر الفرع</option>{branches.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>الرقم التسلسلي</span><input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></label><label><span>عنوان IP</span><input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} placeholder="192.168.1.100" /></label><label><span>المنفذ *</span><input required type="number" min="1" max="65535" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} /></label><label><span>البروتوكول *</span><select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}><option value="http">HTTP</option><option value="https">HTTPS</option><option value="adms">ADMS</option><option value="push">Push</option><option value="sdk">SDK</option></select></label><label><span>الموقع</span><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label><label><span>اسم المستخدم</span><input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label><label><span>كلمة المرور</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label></div><footer><button type="button" onClick={() => setShowForm(false)}>إلغاء</button><button className="hrad-primary" type="submit" disabled={saving}>{saving ? <RefreshCw className="hrad-spin" size={17} /> : <Plus size={17} />}{saving ? "جارٍ الحفظ..." : "حفظ الجهاز"}</button></footer></form></div>}
  </main>;
}
