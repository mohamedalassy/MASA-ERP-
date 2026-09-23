import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";

/**
 * مكوّنات مشتركة لصفحات المالية.
 *
 * كان مفقودًا في كل النسخ، وأربع صفحات بتستورده:
 * FinanceBanks · FinanceCostCenters · FinanceReports · ProjectFinancialCenter
 *
 * كل الكلاسات هنا معرّفة بالفعل في finance-enterprise.css —
 * الملف ده مكتوب على مقاسها بالظبط (.finx-*).
 */

export const API =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const pct = (value, digits = 1) =>
  `${Number(value || 0).toFixed(digits)}%`;

/** بيانات لوحة المالية — GET /finance/dashboard?period= */
export function useFinanceDashboard(period = "year") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/finance/dashboard?period=${encodeURIComponent(period)}`,
        { headers: { Accept: "application/json" } }
      );
      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "تعذر تحميل بيانات المالية.");
      }

      setData(result.data ?? result);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, load };
}

const PERIODS = [
  ["month", "هذا الشهر"],
  ["quarter", "هذا الربع"],
  ["year", "هذه السنة"],
  ["all", "كل الفترات"],
];

export function FinancePageShell({
  icon: Icon,
  title,
  description,
  period,
  onPeriodChange,
  onRefresh,
  loading,
  error,
  actions,
  children,
}) {
  return (
    <div className="finx-page">
      <header className="finx-hero">
        <div>
          <span className="finx-eyebrow">
            {Icon && <Icon size={14} />} المالية والمحاسبة
          </span>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>

        <div className="finx-hero-actions">
          {onPeriodChange && (
            <label className="finx-period">
              <select
                value={period}
                onChange={(e) => onPeriodChange(e.target.value)}
              >
                {PERIODS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          )}

          {actions}

          {onRefresh && (
            <button
              type="button"
              className="finx-btn finx-btn-soft"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} /> تحديث
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="finx-state">
          <div className="finx-loader" />
          <strong>جارٍ تحميل البيانات...</strong>
        </div>
      ) : error ? (
        <div className="finx-state finx-state-error">
          <AlertTriangle size={26} />
          <strong>{error}</strong>
          {onRefresh && (
            <button type="button" className="finx-btn finx-btn-soft" onClick={onRefresh}>
              إعادة المحاولة
            </button>
          )}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function KpiGrid({ items = [] }) {
  return (
    <div className="finx-kpi-grid">
      {items.map(({ label, value, icon: Icon, tone = "purple", meta, metaTone }) => (
        <article className="finx-kpi-card" key={label}>
          <span className={`finx-kpi-icon ${tone}`}>
            {Icon && <Icon size={19} />}
          </span>
          <div className="finx-kpi-main">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
          {meta && (
            <span className={`finx-kpi-meta ${metaTone || "neutral"}`}>{meta}</span>
          )}
        </article>
      ))}
    </div>
  );
}

export function InsightStrip({ items = [] }) {
  return (
    <div className="finx-insight-strip">
      {items.map(({ label, value, icon: Icon }) => (
        <div className="finx-insight" key={label}>
          {Icon && <Icon size={18} />}
          <div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionCard({ className = "", title, subtitle, icon: Icon, actions, children }) {
  return (
    <section className={`finx-card ${className}`}>
      <div className="finx-card-head">
        <div className="finx-card-title">
          {Icon && (
            <span className="finx-card-icon"><Icon size={17} /></span>
          )}
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        {actions}
      </div>
      <div className="finx-card-body">{children}</div>
    </section>
  );
}

/** أعمدة الإيرادات مقابل المصروفات — rows: [{month, income, expenses}] */
export function TrendBars({ rows = [] }) {
  const max = Math.max(
    1,
    ...rows.flatMap((r) => [
      Number(r.income || 0),
      Number(r.expenses ?? r.expense ?? 0),
    ])
  );

  if (!rows.length) {
    return <div className="finx-empty">لا توجد بيانات للفترة.</div>;
  }

  return (
    <div className="finx-trend">
      {rows.map((row, index) => {
        const income = Number(row.income || 0);
        const expense = Number(row.expenses ?? row.expense ?? 0);

        return (
          <div className="finx-trend-col" key={row.month || index}>
            <div className="finx-trend-bars">
              <span
                className="finx-trend-bar income"
                style={{ height: `${(income / max) * 100}%` }}
                title={`إيرادات ${money(income)}`}
              />
              <span
                className="finx-trend-bar expense"
                style={{ height: `${(expense / max) * 100}%` }}
                title={`مصروفات ${money(expense)}`}
              />
            </div>
            <span>{row.label || row.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/** شرائح أعمار الديون — data: {current, "1_30", ...} */
export function AgingBars({ data = {}, labels = {} }) {
  const entries = Object.keys(labels).map((key) => [key, Number(data[key] || 0)]);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="finx-aging-list">
      {entries.map(([key, value]) => (
        <div key={key}>
          <div className="finx-aging-label">
            <span>{labels[key]}</span>
            <b>{money(value)} ر.س</b>
          </div>
          <div className="finx-bar-track">
            <div className="finx-bar-fill" style={{ width: `${(value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** جدول ببحث اختياري — columns: [{key, label, render?}] */
export function FinanceTable({ rows = [], columns = [], searchable = true, emptyText = "لا توجد بيانات." }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;

    return rows.filter((row) =>
      columns.some((col) => String(row[col.key] ?? "").includes(q))
    );
  }, [rows, columns, query]);

  return (
    <div>
      {searchable && (
        <div className="finx-table-tools">
          <label className="finx-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="بحث..."
            />
          </label>
        </div>
      )}
      <div className="finx-table-wrap">
        <table className="finx-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="finx-empty" colSpan={columns.length}>{emptyText}</td>
              </tr>
            ) : (
              visible.map((row, index) => (
                <tr key={row.id ?? index}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
