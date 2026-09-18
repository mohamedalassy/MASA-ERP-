import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Building2,
  ShieldAlert,
  Landmark,
  Fingerprint,
  RefreshCw,
} from "lucide-react";

import { hrApi } from "./hrApi";
import "./hr-v2.css";

export default function PeopleCommandCenter({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await hrApi("/hr/v2/command-center");

      setData(response);
    } catch (err) {
      setError(
        err?.message ||
          "تعذر تحميل بيانات الموارد البشرية"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    [
      "إجمالي الموظفين",
      data?.people?.total || 0,
      Users,
      "hr-v2-people",
    ],
    [
      "النشطون",
      data?.people?.active || 0,
      Users,
      "hr-v2-people",
    ],
    [
      "الفروع",
      data?.organization?.branches || 0,
      Building2,
      "hr-v2-organization",
    ],
    [
      "جاهزون للبصمة",
      data?.people?.biometric_ready || 0,
      Fingerprint,
      "hr-v2-attendance",
    ],
    [
      "استثناءات الامتثال",
      data?.compliance?.open || 0,
      ShieldAlert,
      "hr-v2-compliance",
    ],
    [
      "الربط الحكومي",
      `${data?.government?.connected || 0}/${
        data?.government?.connectors || 0
      }`,
      Landmark,
      "hr-v2-government",
    ],
  ];

  return (
    <section className="pv2-page" dir="rtl">
      <header className="pv2-hero">
        <div>
          <small>MASA PEOPLE • HCM V2</small>

          <h1>People Command Center</h1>

          <p>
            الموظفون والهيكل والامتثال والربط الحكومي
            من مركز واحد.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "spin" : ""}
          />

          {loading ? "جاري التحديث..." : "تحديث"}
        </button>
      </header>

      {error && (
        <div className="pv2-error">
          {error}
        </div>
      )}

      <div className="pv2-kpis">
        {cards.map(([name, value, Icon, target]) => (
          <button
            type="button"
            key={name}
            onClick={() => onNavigate?.(target)}
          >
            <Icon />

            <small>{name}</small>

            <strong>{value}</strong>
          </button>
        ))}
      </div>

      <div className="pv2-grid">
        <article>
          <h2>أحدث الموظفين</h2>

          {loading && !data && (
            <p>جاري تحميل البيانات...</p>
          )}

          {!loading &&
            (data?.recent_employees || []).length === 0 && (
              <p>لا يوجد موظفون حتى الآن.</p>
            )}

          {(data?.recent_employees || []).map(
            (employee) => (
              <p key={employee.id}>
                <b>
                  {employee.full_name ||
                    `${employee.first_name || ""} ${
                      employee.last_name || ""
                    }`}
                </b>

                <span>
                  {employee.job_title?.name || "—"}
                </span>
              </p>
            )
          )}
        </article>

        <article>
          <h2>Exception Center</h2>

          {loading && !data && (
            <p>جاري تحميل الاستثناءات...</p>
          )}

          {!loading &&
            (data?.exceptions || []).length === 0 && (
              <p>لا توجد استثناءات مفتوحة.</p>
            )}

          {(data?.exceptions || []).map(
            (exception) => (
              <p key={exception.id}>
                <b>{exception.title}</b>

                <span
                  className={`sev ${
                    exception.severity || ""
                  }`}
                >
                  {exception.severity || "—"}
                </span>
              </p>
            )
          )}
        </article>
      </div>
    </section>
  );
}