import { useCallback, useEffect, useState } from "react";
import { hrApi, hrGet, hrPost, hrPatch } from "./hrApi";
import "./hr-v2.css";

const initial = {
  employee_number: "", first_name: "", last_name: "", branch_id: "",
  national_id: "", iqama_number: "", iban: "", bank_name: "",
  hire_date: "", nationality_type: "saudi", gosi_subscribed: false,
  gosi_first_registration_date: "", contract_number: "", start_date: "",
  end_date: "", basic_salary: "", housing_allowance: "0",
  transport_allowance: "0", other_allowances: "0",
};

export default function EmployeeDirectoryV2({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [wpsForm, setWpsForm] = useState({
    national_id: "", iqama_number: "", iban: "", bank_name: "",
  });

  const load = useCallback(async (search = "") => {
    try {
      const x = await hrApi(
        `/hr/employees?per_page=100&search=${encodeURIComponent(search)}`
      );
      setRows(x.data || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(q), 250);
    return () => clearTimeout(timer);
  }, [q, load]);

  useEffect(() => {
    hrGet("/hr/branches?per_page=100")
      .then((x) => setBranches(x.data || []))
      .catch((e) => setError(e.message));
  }, []);

  function field(key, label, type = "text", extra = {}) {
    return (
      <label style={{ display: "grid", gap: 6 }} key={key}>
        <span>{label}</span>
        <input
          type={type}
          value={form[key]}
          onChange={(e) =>
            setForm((old) => ({ ...old, [key]: e.target.value }))
          }
          style={{
            padding: 10,
            border: "1px solid #d8dbea",
            borderRadius: 9,
            width: "100%",
            boxSizing: "border-box",
          }}
          {...extra}
        />
      </label>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        national_id: form.national_id || null,
        iqama_number: form.iqama_number || null,
        iban: form.iban.replace(/\s/g, "").toUpperCase() || null,
        bank_name: form.bank_name || null,
        branch_id: form.branch_id ? Number(form.branch_id) : null,
        gosi_subscribed: form.gosi_subscribed,
        gosi_first_registration_date:
          form.gosi_first_registration_date || null,
        contract_number: form.contract_number || null,
        end_date: form.end_date || null,
        basic_salary: Number(form.basic_salary),
        housing_allowance: Number(form.housing_allowance),
        transport_allowance: Number(form.transport_allowance),
        other_allowances: Number(form.other_allowances),
      };

      await hrPost("/hr/v2/payroll/employees", payload);
      setForm(initial);
      setOpen(false);
      await load(q);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(employee) {
    setEditing(employee.id);
    setError("");
    setWpsForm({
      national_id: employee.national_id || "",
      iqama_number: employee.iqama_number || "",
      iban: employee.iban || "",
      bank_name: employee.bank_name || "",
    });
  }

  async function saveWps(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await hrPatch(`/hr/v2/payroll/employees/${editing}/wps-details`, {
        national_id: wpsForm.national_id || null,
        iqama_number: wpsForm.iqama_number || null,
        iban: wpsForm.iban.replace(/\s/g, "").toUpperCase() || null,
        bank_name: wpsForm.bank_name || null,
      });
      setEditing(null);
      await load(q);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="pv2-page" dir="rtl">
      <header className="pv2-hero">
        <div>
          <small>PEOPLE DIRECTORY</small>
          <h1>الموظفون</h1>
          <p>الدليل المركزي وبوابة Employee 360.</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)}>
          + إضافة موظف وعقد
        </button>
      </header>

      {error && <div className="pv2-error" role="alert">{error}</div>}

      {open && (
        <form
          onSubmit={submit}
          className="pv2-panel"
          style={{ display: "grid", gap: 14, marginBottom: 16 }}
        >
          <h2>موظف جديد وعقد ساري</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
              gap: 14,
            }}
          >
            {field("employee_number", "رقم الموظف", "text", {
              required: true,
            })}
            {field("first_name", "الاسم الأول", "text", {
              required: true,
            })}
            {field("last_name", "اسم العائلة", "text", {
              required: true,
            })}
            {field("national_id", "رقم الهوية (10 أرقام)", "text", {
              inputMode: "numeric",
              pattern: "[0-9]{10}",
              required: form.nationality_type === "saudi",
            })}
            {field("iqama_number", "رقم الإقامة (10 أرقام)", "text", {
              inputMode: "numeric",
              pattern: "[0-9]{10}",
              required: form.nationality_type === "expat",
            })}
            {field("iban", "الآيبان السعودي (SA + 22 رقمًا)", "text", {
              pattern: "[Ss][Aa][0-9]{22}",
              placeholder: "SA...",
              dir: "ltr",
            })}
            {field("bank_name", "اسم البنك (اختياري)")}
            {field("hire_date", "تاريخ التعيين", "date", {
              required: true,
            })}

            <label style={{ display: "grid", gap: 6 }}>
              <span>الفرع (اختياري)</span>
              <select
                value={form.branch_id}
                onChange={(e) =>
                  setForm({ ...form, branch_id: e.target.value })
                }
              >
                <option value="">كل الفروع / بدون فرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>نوع الجنسية</span>
              <select
                value={form.nationality_type}
                onChange={(e) =>
                  setForm({ ...form, nationality_type: e.target.value })
                }
              >
                <option value="saudi">سعودي</option>
                <option value="gcc">خليجي</option>
                <option value="expat">وافد</option>
              </select>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={form.gosi_subscribed}
                onChange={(e) =>
                  setForm({ ...form, gosi_subscribed: e.target.checked })
                }
              />
              مشترك في التأمينات
            </label>

            {form.gosi_subscribed &&
              field(
                "gosi_first_registration_date",
                "تاريخ أول اشتراك تأمينات",
                "date",
                { required: true }
              )}

            {field("contract_number", "رقم العقد (اختياري)")}
            {field("start_date", "بداية العقد", "date", {
              required: true,
            })}
            {field("end_date", "نهاية العقد (اختياري)", "date")}
            {field("basic_salary", "الراتب الأساسي", "number", {
              required: true,
              min: "0.01",
              step: "0.01",
            })}
            {field("housing_allowance", "بدل السكن", "number", {
              required: true,
              min: "0",
              step: "0.01",
            })}
            {field("transport_allowance", "بدل النقل", "number", {
              required: true,
              min: "0",
              step: "0.01",
            })}
            {field("other_allowances", "بدلات أخرى", "number", {
              required: true,
              min: "0",
              step: "0.01",
            })}
          </div>

          <div>
            <button type="submit" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "حفظ الموظف والعقد"}
            </button>
          </div>
        </form>
      )}

      <input
        className="pv2-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث عن موظف..."
      />

      <article className="pv2-panel">
        {rows.map((employee) => (
          <div key={employee.id}>
            <div
              className="employee-row"
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <button
                type="button"
                onClick={() =>
                  onNavigate?.("hr-v2-employee-360", {
                    employeeId: employee.id,
                  })
                }
              >
                <b>
                  {employee.full_name ||
                    `${employee.first_name || ""} ${
                      employee.last_name || ""
                    }`}
                </b>
              </button>
              <span>{employee.job_title?.name || "—"}</span>
              <span>{employee.department?.name || "—"}</span>
              <button type="button" onClick={() => startEdit(employee)}>
                تعديل بيانات WPS
              </button>
            </div>

            {editing === employee.id && (
              <form
                onSubmit={saveWps}
                style={{ display: "grid", gap: 12, padding: 16 }}
              >
                <strong>بيانات الهوية والبنك: {employee.full_name}</strong>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(190px,1fr))",
                    gap: 12,
                  }}
                >
                  {[
                    ["national_id", "رقم الهوية", "[0-9]{10}"],
                    ["iqama_number", "رقم الإقامة", "[0-9]{10}"],
                    ["iban", "الآيبان السعودي", "[Ss][Aa][0-9]{22}"],
                    ["bank_name", "اسم البنك", undefined],
                  ].map(([key, label, pattern]) => (
                    <label key={key}>
                      {label}
                      <input
                        style={{
                          display: "block",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                        value={wpsForm[key]}
                        pattern={pattern}
                        dir={key === "iban" ? "ltr" : undefined}
                        onChange={(e) =>
                          setWpsForm((old) => ({
                            ...old,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !(wpsForm.national_id || wpsForm.iqama_number)
                    }
                  >
                    {saving ? "جارٍ الحفظ..." : "حفظ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </article>
    </section>
  );
}