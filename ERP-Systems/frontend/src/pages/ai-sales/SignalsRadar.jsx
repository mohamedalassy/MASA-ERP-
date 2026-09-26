import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, Building2, Filter, Gauge, Plus, Radar, RefreshCw,
  Search, Sparkles, Target, TrendingUp, X,
} from "lucide-react";
import { Shell } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

const SIGNAL_TYPES = [
  ["new_business", "نشاط جديد"],
  ["expansion", "توسع"],
  ["new_branch", "فرع جديد"],
  ["hiring", "توظيف"],
  ["funding", "تمويل"],
  ["tender", "منافسة"],
  ["procurement", "مشتريات"],
  ["project", "مشروع"],
  ["digital_activity", "نشاط رقمي"],
];

const labelType = (type) =>
  SIGNAL_TYPES.find(([value]) => value === type)?.[1] ||
  String(type || "إشارة").replaceAll("_", " ");

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ar-SA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function SignalsRadar({
  onNavigate,
  activeView = "ai-sales-signals",
}) {
  const [payload, setPayload] = useState({
    data: [],
    summary: {},
    types: [],
    companies: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const inFlight = useRef(new Map());

  const [filters, setFilters] = useState({
    search: "",
    type: "",
    company_id: "",
    min_strength: 0,
    high_intent: false,
  });

  const [form, setForm] = useState({
    company_id: "",
    type: "expansion",
    title: "",
    description: "",
    strength: 70,
    confidence: 70,
    source: "manual",
    source_url: "",
    detected_at: "",
    expires_at: "",
  });

  const serverQuery = useMemo(() => {
    const qs = new URLSearchParams();
    if (filters.type) qs.set("type", filters.type);
    if (filters.company_id) qs.set("company_id", filters.company_id);
    if (Number(filters.min_strength) > 0) {
      qs.set("min_strength", String(filters.min_strength));
    }
    if (filters.high_intent) qs.set("high_intent", "1");
    return qs.toString();
  }, [
    filters.type,
    filters.company_id,
    filters.min_strength,
    filters.high_intent,
  ]);

  const load = async ({ force = false } = {}) => {
    const path = `/signals${serverQuery ? `?${serverQuery}` : ""}`;

    if (!force && inFlight.current.has(path)) {
      return inFlight.current.get(path);
    }

    setLoading(true);
    setError("");

    const request = aiSalesRequest(path);
    if (!force) inFlight.current.set(path, request);

    try {
      const result = await request;
      setPayload(
        result || {
          data: [],
          summary: {},
          types: [],
          companies: [],
        }
      );
      return result;
    } catch (err) {
      setError(err?.message || "تعذر تحميل إشارات الشراء.");
      throw err;
    } finally {
      if (inFlight.current.get(path) === request) {
        inFlight.current.delete(path);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => {});
    }, 100);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverQuery]);

  const visibleSignals = useMemo(() => {
    const needle = filters.search.trim().toLowerCase();
    if (!needle) return payload.data || [];

    return (payload.data || []).filter((signal) =>
      [
        signal.title,
        signal.description,
        signal.type,
        signal.source,
        signal.company?.name,
        signal.company?.industry,
        signal.company?.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [payload.data, filters.search]);

  const summary = payload.summary || {};

  const openCompany = (companyId) => {
    if (!companyId) return;
    sessionStorage.setItem("aiSalesSelectedCompanyId", String(companyId));
    onNavigate?.("ai-sales-company");
  };

  const resetFilters = () =>
    setFilters({
      search: "",
      type: "",
      company_id: "",
      min_strength: 0,
      high_intent: false,
    });

  const submitSignal = async (event) => {
    event.preventDefault();

    if (!form.company_id) {
      setError("اختر الشركة أولًا.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await aiSalesRequest(`/companies/${form.company_id}/signals`, {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim() || null,
          strength: Number(form.strength),
          confidence: Number(form.confidence),
          source: form.source.trim() || null,
          source_url: form.source_url.trim() || null,
          detected_at: form.detected_at || null,
          expires_at: form.expires_at || null,
        }),
      });

      setComposerOpen(false);
      setForm({
        company_id: "",
        type: "expansion",
        title: "",
        description: "",
        strength: 70,
        confidence: 70,
        source: "manual",
        source_url: "",
        detected_at: "",
        expires_at: "",
      });

      await load({ force: true });
    } catch (err) {
      setError(err?.message || "تعذر إنشاء إشارة الشراء.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="رادار إشارات الشراء"
      subtitle="اكتشف أحداث السوق الحقيقية التي تشير إلى طلب قادم ورتّبها حسب الأولوية."
    >
      <div className="signals-page" dir="rtl">
        <div className="signals-toolbar">
          <div>
            <div className="signals-eyebrow">ذكاء السوق</div>
            <h2>إشارات شراء مباشرة مرتبطة بتقييم المبيعات الذكية</h2>
          </div>

          <div className="signals-actions">
            <button
              className="signals-btn secondary"
              onClick={() => load({ force: true })}
            >
              <RefreshCw size={16} />
              {loading ? "جارٍ التحديث..." : "تحديث"}
            </button>

            <button
              className="signals-btn primary"
              onClick={() => setComposerOpen(true)}
            >
              <Plus size={16} />
              إضافة إشارة
            </button>
          </div>
        </div>

        {error && <div className="signals-error">{error}</div>}

        <div className="signals-kpis">
          <Metric
            icon={Radar}
            label="الإشارات النشطة"
            value={summary.active_signals || 0}
            hint="إشارات غير منتهية"
          />
          <Metric
            icon={Sparkles}
            label="نية شراء مرتفعة"
            value={summary.high_intent || 0}
            hint="قوة ≥ 70 وثقة ≥ 60"
          />
          <Metric
            icon={Building2}
            label="الشركات المغطاة"
            value={summary.companies_with_signals || 0}
            hint="حسابات ذات إشارات نشطة"
          />
          <Metric
            icon={Gauge}
            label="متوسط القوة"
            value={`${summary.average_strength || 0}/100`}
            hint="شدة الإشارات النشطة"
          />
          <Metric
            icon={Target}
            label="متوسط الثقة"
            value={`${summary.average_confidence || 0}/100`}
            hint="موثوقية الأدلة"
          />
        </div>

        <div className="signals-overview-grid">
          <section className="signals-panel">
            <PanelHead
              title="توزيع الإشارات"
              subtitle="الإشارات النشطة مجمعة حسب حدث السوق"
              icon={Activity}
            />

            <div className="signals-type-grid">
              {(payload.types || []).length ? (
                payload.types.map((row) => (
                  <button
                    key={row.type}
                    className={`signals-type-card ${
                      filters.type === row.type ? "active" : ""
                    }`}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        type:
                          current.type === row.type ? "" : row.type,
                      }))
                    }
                  >
                    <div className="signals-type-top">
                      <span>{labelType(row.type)}</span>
                      <strong>{row.count}</strong>
                    </div>

                    <div className="signals-type-stats">
                      <span>القوة {row.average_strength}/100</span>
                      <span>الثقة {row.average_confidence}/100</span>
                    </div>

                    <div className="signals-track">
                      <i
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, row.average_strength || 0)
                          )}%`,
                        }}
                      />
                    </div>
                  </button>
                ))
              ) : (
                <Empty text="لا توجد إشارات نشطة حتى الآن." />
              )}
            </div>
          </section>

          <section className="signals-panel">
            <PanelHead
              title="صحة الرادار"
              subtitle="تغطية الذكاء الحالية"
              icon={TrendingUp}
            />

            <div className="signals-health">
              <div className="signals-ring">
                <div>
                  <strong>{summary.active_signals || 0}</strong>
                  <span>نشطة</span>
                </div>
              </div>

              <div className="signals-health-rows">
                <HealthRow
                  label="نسبة النية المرتفعة"
                  value={
                    summary.active_signals
                      ? `${Math.round(
                          (Number(summary.high_intent || 0) /
                            Number(summary.active_signals)) *
                            100
                        )}%`
                      : "0%"
                  }
                />
                <HealthRow
                  label="الشركات المغطاة"
                  value={summary.companies_with_signals || 0}
                />
                <HealthRow
                  label="متوسط القوة"
                  value={`${summary.average_strength || 0}/100`}
                />
                <HealthRow
                  label="متوسط الثقة"
                  value={`${summary.average_confidence || 0}/100`}
                />
              </div>
            </div>
          </section>
        </div>

        <section className="signals-panel">
          <PanelHead
            title="سجل الإشارات"
            subtitle={`${visibleSignals.length} إشارة مطابقة للفلاتر الحالية`}
            icon={Filter}
          />

          <div className="signals-filters">
            <div className="signals-search">
              <Search size={16} />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    search: e.target.value,
                  }))
                }
                placeholder="ابحث عن إشارة أو شركة أو مدينة..."
              />
            </div>

            <select
              value={filters.type}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  type: e.target.value,
                }))
              }
            >
              <option value="">كل أنواع الإشارات</option>
              {SIGNAL_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={filters.company_id}
              onChange={(e) =>
                setFilters((current) => ({
                  ...current,
                  company_id: e.target.value,
                }))
              }
            >
              <option value="">كل الشركات</option>
              {(payload.companies || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            <label className="signals-range">
              <span>القوة ≥ {filters.min_strength}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.min_strength}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    min_strength: Number(e.target.value),
                  }))
                }
              />
            </label>

            <label className="signals-check">
              <input
                type="checkbox"
                checked={filters.high_intent}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    high_intent: e.target.checked,
                  }))
                }
              />
              نية شراء مرتفعة
            </label>

            <button
              className="signals-clear"
              onClick={resetFilters}
            >
              مسح الفلاتر
            </button>
          </div>

          <div className="signals-list">
            {loading ? (
              <Empty text="جارٍ تحميل الإشارات..." />
            ) : visibleSignals.length ? (
              visibleSignals.map((signal) => (
                <article
                  key={signal.id}
                  className="signals-row"
                >
                  <div className="signals-row-icon">
                    <Activity size={18} />
                  </div>

                  <div className="signals-row-main">
                    <div className="signals-row-title">
                      <div>
                        <b>{signal.title}</b>
                        <span className="signals-badge">
                          {labelType(signal.type)}
                        </span>
                      </div>

                      <time>{fmtDate(signal.detected_at)}</time>
                    </div>

                    <p>
                      {signal.description ||
                        "لا يوجد وصف إضافي."}
                    </p>

                    <div className="signals-meta">
                      <button
                        onClick={() =>
                          openCompany(signal.company?.id)
                        }
                      >
                        {signal.company?.name ||
                          "شركة غير معروفة"}
                      </button>

                      <span>
                        {[
                          signal.company?.city,
                          signal.company?.industry,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "—"}
                      </span>

                      <span>
                        المصدر: {signal.source || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="signals-scores">
                    <ScoreBox
                      label="القوة"
                      value={signal.strength}
                    />
                    <ScoreBox
                      label="الثقة"
                      value={signal.confidence}
                    />
                    <ScoreBox
                      label="درجة الذكاء"
                      value={signal.company?.ai_score || 0}
                    />
                  </div>
                </article>
              ))
            ) : (
              <Empty text="لا توجد إشارات تطابق عوامل التصفية." />
            )}
          </div>
        </section>

        {composerOpen && (
          <div
            className="signals-backdrop"
            onMouseDown={() => setComposerOpen(false)}
          >
            <form
              className="signals-modal"
              onSubmit={submitSignal}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="signals-modal-head">
                <div>
                  <div className="signals-eyebrow">
                    إشارة شراء
                  </div>
                  <h3>إضافة إشارة سوق</h3>
                </div>

                <button
                  type="button"
                  className="signals-icon-btn"
                  onClick={() => setComposerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="signals-form">
                <Field label="الشركة *">
                  <select
                    required
                    value={form.company_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company_id: e.target.value,
                      })
                    }
                  >
                    <option value="">اختر الشركة</option>
                    {(payload.companies || []).map(
                      (company) => (
                        <option
                          key={company.id}
                          value={company.id}
                        >
                          {company.name}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="نوع الإشارة *">
                  <select
                    required
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value,
                      })
                    }
                  >
                    {SIGNAL_TYPES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="العنوان *" wide>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    placeholder="مثال: الشركة أعلنت عن افتتاح فرع جديد"
                  />
                </Field>

                <Field label="الوصف" wide>
                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        description: e.target.value,
                      })
                    }
                    placeholder="الأدلة والسياق المرتبط بإشارة الشراء"
                  />
                </Field>

                <Field
                  label={`القوة: ${form.strength}/100`}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.strength}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        strength: Number(e.target.value),
                      })
                    }
                  />
                </Field>

                <Field
                  label={`الثقة: ${form.confidence}/100`}
                >
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.confidence}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        confidence: Number(e.target.value),
                      })
                    }
                  />
                </Field>

                <Field label="المصدر">
                  <input
                    value={form.source}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        source: e.target.value,
                      })
                    }
                    placeholder="يدوي، خبر، سجل..."
                  />
                </Field>

                <Field label="رابط المصدر">
                  <input
                    value={form.source_url}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        source_url: e.target.value,
                      })
                    }
                    placeholder="رابط الدليل — اختياري"
                  />
                </Field>

                <Field label="تاريخ الاكتشاف">
                  <input
                    type="datetime-local"
                    value={form.detected_at}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        detected_at: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="تاريخ الانتهاء">
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        expires_at: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <div className="signals-note">
                إنشاء الإشارة يعيد حساب درجات النية
                والتوقيت والدرجة الإجمالية للشركة تلقائيًا.
              </div>

              <div className="signals-modal-foot">
                <button
                  type="button"
                  className="signals-btn secondary"
                  onClick={() => setComposerOpen(false)}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="signals-btn primary"
                  disabled={saving}
                >
                  {saving
                    ? "جارٍ الحفظ..."
                    : "إنشاء إشارة"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Shell>
  );
}

function Metric({ icon: Icon, label, value, hint }) {
  return (
    <div className="signals-metric">
      <div className="signals-metric-icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}

function PanelHead({ title, subtitle, icon: Icon }) {
  return (
    <header className="signals-panel-head">
      <div>
        <b>{title}</b>
        <span>{subtitle}</span>
      </div>
      <Icon size={18} />
    </header>
  );
}

function HealthRow({ label, value }) {
  return (
    <div className="signals-health-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ScoreBox({ label, value }) {
  const score = Number(value || 0);

  return (
    <div className="signals-score">
      <span>{label}</span>
      <b>{score}/100</b>
      <div>
        <i
          style={{
            width: `${Math.max(
              0,
              Math.min(100, score)
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function Field({ label, wide = false, children }) {
  return (
    <label
      className={`signals-field ${
        wide ? "wide" : ""
      }`}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }) {
  return <div className="signals-empty">{text}</div>;
}
