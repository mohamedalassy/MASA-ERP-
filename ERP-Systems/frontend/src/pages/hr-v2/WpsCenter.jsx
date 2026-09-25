import { useCallback, useEffect, useState } from "react";
import { Banknote, Download, FileCheck2, RefreshCw } from "lucide-react";
import { hrGet, hrPost } from "./hrApi";
import { API_URL } from "../../api/erpApi";
import "./hr-v2.css";
import "./hr-v2-stage4.css";

export default function WpsCenter() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [checks, setChecks] = useState({});
  const [message, setMessage] = useState("");
  const [generated, setGenerated] = useState({});

  const load = useCallback(async () => {
    try {
      const response = await hrGet("/hr/v2/wps/batches");
      setRows(response.data || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function validate(id) {
    setBusy(`validate-${id}`);
    setError("");
    setMessage("");

    try {
      const response = await hrPost(
        `/hr/v2/payroll/runs/${id}/wps/validate`
      );
      setChecks((current) => ({
        ...current,
        [id]: response.data,
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  async function generate(id) {
    setBusy(`generate-${id}`);
    setError("");
    setMessage("");

    try {
      const response = await hrPost("/hr/v2/wps/generate", {
        payroll_run_id: id,
      });

      setChecks((current) => ({
        ...current,
        [id]: response.data?.validation,
      }));
      setGenerated((current) => ({
        ...current,
        [id]: true,
      }));
      setMessage(
        `تم توليد ملف WPS لـ ${response.data?.rows ?? 0} موظف.`
      );
      await load();
    } catch (e) {
      const validation = e.data?.data?.validation ?? e.data?.data;

      if (validation?.errors) {
        setChecks((current) => ({
          ...current,
          [id]: validation,
        }));
      } else {
        setError(e.message);
      }

      await load();
    } finally {
      setBusy("");
    }
  }

  async function download(row) {
    setBusy(`download-${row.id}`);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/hr/v2/payroll/runs/${row.id}/wps/download`,
        {
          credentials: "include",
          headers: {
            Accept: "text/csv, application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message ||
            `تعذر تنزيل الملف (${response.status}).`
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `WPS-${row.salary_month}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="pv2-page" dir="rtl">
      <header className="pv2-hero">
        <div>
          <small>WAGE PROTECTION</small>
          <h1>WPS Center</h1>
          <p>
            نفس تشغيل الرواتب المعتمد هو مصدر بيانات حماية الأجور.
          </p>
        </div>
        <Banknote size={36} />
      </header>

      {error && (
        <div className="pv2-error" role="alert">
          {error}
        </div>
      )}
      {message && <div role="status">{message}</div>}

      <article className="pv2-panel">
        {rows.length ? (
          rows.map((row) => {
            const check = checks[row.id];

            return (
              <div key={row.id}>
                <div className="gov-row">
                  <FileCheck2 size={16} />
                  <b>{row.batch_number}</b>
                  <span>{row.salary_month}</span>
                  <span>{row.lines_count} موظف</span>
                  <span>
                    {Number(row.total_net || 0).toLocaleString()} SAR
                  </span>
                  <span className={`status ${row.status}`}>
                    {row.status}
                  </span>

                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => validate(row.id)}
                  >
                    {busy === `validate-${row.id}` ? (
                      <RefreshCw size={15} />
                    ) : (
                      "فحص البيانات"
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!!busy || check?.is_valid === false}
                    onClick={() => generate(row.id)}
                  >
                    {busy === `generate-${row.id}` ? (
                      <RefreshCw size={15} />
                    ) : (
                      "Generate"
                    )}
                  </button>

                  {(row.wps_generated_at || generated[row.id]) && (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => download(row)}
                    >
                      {busy === `download-${row.id}` ? (
                        <RefreshCw size={15} />
                      ) : (
                        <>
                          <Download size={15} /> تنزيل ملف WPS
                        </>
                      )}
                    </button>
                  )}
                </div>

                {check && (
                  <div
                    role="status"
                    style={{ padding: "12px 18px" }}
                  >
                    <strong>
                      {check.is_valid
                        ? "الفحص ناجح"
                        : "يلزم تصحيح البيانات قبل التوليد"}
                    </strong>

                    {check.errors?.length > 0 && (
                      <ul>
                        {check.errors.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}

                    {check.warnings?.length > 0 && (
                      <ul>
                        {check.warnings.map((item, i) => (
                          <li key={`w-${i}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p>لا توجد تشغيلات جاهزة لـ WPS حتى الآن.</p>
        )}
      </article>
    </section>
  );
}