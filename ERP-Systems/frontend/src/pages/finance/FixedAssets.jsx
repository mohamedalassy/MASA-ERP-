import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { API, FinancePageShell, FinanceTable, KpiGrid, money } from "./FinancePageShared";

const emptyForm = {
  asset_code: "", name: "", description: "", purchase_date: "",
  in_service_date: "", cost: "", salvage_value: "0",
  useful_life_months: "60", status: "active",
};

export default function FixedAssets() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const res = await fetch(`${API}/finance/fixed-assets`, { headers: { Accept: "application/json" } });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "تعذر تحميل الأصول.");
      setRows(json.data || []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const res = await fetch(`${API}/finance/fixed-assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...form,
          cost: Number(form.cost),
          salvage_value: Number(form.salvage_value || 0),
          useful_life_months: Number(form.useful_life_months),
          in_service_date: form.in_service_date || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "تعذر حفظ الأصل.");
      setForm(emptyForm); setShowForm(false); load();
    } catch (e) { setError(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm("حذف الأصل؟")) return;
    const res = await fetch(`${API}/finance/fixed-assets/${id}`, { method: "DELETE", headers: { Accept: "application/json" } });
    if (res.ok) load();
  };

  const totalCost = useMemo(() => rows.reduce((s, x) => s + Number(x.cost || 0), 0), [rows]);
  const active = useMemo(() => rows.filter((x) => x.status === "active").length, [rows]);

  const columns = [
    { key: "asset_code", label: "الكود" },
    { key: "name", label: "الأصل" },
    { key: "purchase_date", label: "تاريخ الشراء" },
    { key: "cost", label: "التكلفة", render: (r) => `${money(r.cost)} ر.س` },
    { key: "useful_life_months", label: "العمر", render: (r) => `${r.useful_life_months} شهر` },
    { key: "status", label: "الحالة", render: (r) => r.status === "active" ? "نشط" : r.status },
    { key: "actions", label: "", render: (r) => <button className="finx-btn finx-btn-soft" onClick={() => remove(r.id)}><Trash2 size={15} /> حذف</button> },
  ];

  return (
    <FinancePageShell icon={Building2} title="الأصول الثابتة"
      description="تسجيل ومتابعة الأصول الثابتة وبيانات التكلفة والعمر الإنتاجي."
      loading={loading} error={error} onRefresh={load}
      actions={<button className="finx-btn finx-btn-primary" onClick={() => setShowForm((v) => !v)}><Plus size={16}/> أصل جديد</button>}>
      <KpiGrid items={[
        { label: "عدد الأصول", value: rows.length, icon: Building2 },
        { label: "الأصول النشطة", value: active, icon: RefreshCw, tone: "green" },
        { label: "إجمالي التكلفة", value: `${money(totalCost)} ر.س`, icon: Building2, tone: "purple" },
      ]}/>
      {showForm && <form className="finx-card" onSubmit={save}>
        <div className="finx-card-head"><div className="finx-card-title"><h2>تسجيل أصل جديد</h2></div></div>
        <div className="finx-form-grid">
          <label>كود الأصل<input required value={form.asset_code} onChange={e=>setForm({...form,asset_code:e.target.value})}/></label>
          <label>اسم الأصل<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
          <label>تاريخ الشراء<input required type="date" value={form.purchase_date} onChange={e=>setForm({...form,purchase_date:e.target.value})}/></label>
          <label>تاريخ التشغيل<input type="date" value={form.in_service_date} onChange={e=>setForm({...form,in_service_date:e.target.value})}/></label>
          <label>التكلفة<input required type="number" min="0" step="0.01" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})}/></label>
          <label>القيمة التخريدية<input type="number" min="0" step="0.01" value={form.salvage_value} onChange={e=>setForm({...form,salvage_value:e.target.value})}/></label>
          <label>العمر الإنتاجي بالشهور<input required type="number" min="1" value={form.useful_life_months} onChange={e=>setForm({...form,useful_life_months:e.target.value})}/></label>
        </div>
        <button className="finx-btn finx-btn-primary" type="submit">حفظ الأصل</button>
      </form>}
      <FinanceTable rows={rows} columns={columns} emptyText="لا توجد أصول ثابتة مسجلة."/>
    </FinancePageShell>
  );
}
