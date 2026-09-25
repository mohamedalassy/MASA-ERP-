import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Filter,
  Gauge,
  Plus,
  Radar,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { Shell } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

const PURPLE = "#6657F5";

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
  String(type || "إشارة")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
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

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams();
      if (filters.type) qs.set("type", filters.type);
      if (filters.company_id) qs.set("company_id", filters.company_id);
      if (Number(filters.min_strength) > 0) {
        qs.set("min_strength", String(filters.min_strength));
      }
      if (filters.high_intent) qs.set("high_intent", "1");

      const result = await aiSalesRequest(
        `/signals${qs.toString() ? `?${qs.toString()}` : ""}`
      );

      setPayload(
        result || {
          data: [],
          summary: {},
          types: [],
          companies: [],
        }
      );
    } catch (err) {
      setError(err?.message || "Unable to load buying signals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [
    filters.type,
    filters.company_id,
    filters.min_strength,
    filters.high_intent,
  ]);

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
      setError("Select a company first.");
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
      await load();
    } catch (err) {
      setError(err?.message || "Unable to create buying signal.");
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
      <div style={styles.page}>
        <div style={styles.toolbar}>
          <div>
            <div style={styles.eyebrow}>MARKET INTELLIGENCE</div>
            <div style={styles.heading}>
              Live buying signals connected to AI Sales scoring
            </div>
          </div>

          <div style={styles.actions}>
            <button style={styles.secondaryButton} onClick={load}>
              <RefreshCw size={15} />
              {loading ? "جارٍ التحديث..." : "تحديث"}
            </button>
            <button
              style={styles.primaryButton}
              onClick={() => setComposerOpen(true)}
            >
              <Plus size={15} />
              Add Signal
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.kpis}>
          <Metric
            icon={Radar}
            label="الإشارات النشطة"
            value={summary.active_signals || 0}
            hint="غير منتهية"
          />
          <Metric
            icon={Sparkles}
            label="نية شراء مرتفعة"
            value={summary.high_intent || 0}
            hint="القوة ≥70 والثقة ≥60"
          />
          <Metric
            icon={Building2}
            label="الشركات"
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
            hint="الثقة في الأدلة"
          />
        </div>

        <div style={styles.radarGrid}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <b>Signal Distribution</b>
                <span>Active signals grouped by market event</span>
              </div>
              <Activity size={18} />
            </div>

            <div style={styles.typeGrid}>
              {(payload.types || []).length ? (
                payload.types.map((row) => (
                  <button
                    key={row.type}
                    style={{
                      ...styles.typeCard,
                      ...(filters.type === row.type
                        ? styles.typeCardActive
                        : {}),
                    }}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        type:
                          current.type === row.type ? "" : row.type,
                      }))
                    }
                  >
                    <div style={styles.typeTop}>
                      <span>{labelType(row.type)}</span>
                      <strong>{row.count}</strong>
                    </div>
                    <div style={styles.typeStats}>
                      <span>Strength {row.average_strength}/100</span>
                      <span>Confidence {row.average_confidence}/100</span>
                    </div>
                    <div style={styles.track}>
                      <i
                        style={{
                          ...styles.fill,
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
                <Empty text="No active signals yet. Add the first real market signal." />
              )}
            </div>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <b>Radar Health</b>
                <span>Current intelligence coverage</span>
              </div>
              <TrendingUp size={18} />
            </div>

            <div style={styles.healthBody}>
              <div style={styles.ring}>
                <div>
                  <strong>{summary.active_signals || 0}</strong>
                  <span>ACTIVE</span>
                </div>
              </div>

              <div style={styles.healthRows}>
                <HealthRow
                  label="High-intent share"
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
                  label="Companies covered"
                  value={summary.companies_with_signals || 0}
                />
                <HealthRow
                  label="Avg strength"
                  value={`${summary.average_strength || 0}/100`}
                />
                <HealthRow
                  label="Avg confidence"
                  value={`${summary.average_confidence || 0}/100`}
                />
              </div>
            </div>
          </section>
        </div>

        <section style={styles.feedPanel}>
          <div style={styles.feedHeader}>
            <div>
              <b>Signal Feed</b>
              <span>
                {visibleSignals.length} signal
                {visibleSignals.length === 1 ? "" : "s"} matching filters
              </span>
            </div>
            <Filter size={17} />
          </div>

          <div style={styles.filters}>
            <div style={styles.searchBox}>
              <Search size={14} />
              <input
                value={filters.search}
                onChange={(e) =>
                  setFilters((current) => ({
                    ...current,
                    search: e.target.value,
                  }))
                }
                placeholder="ابحث عن إشارة أو شركة أو مدينة"
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
              <option value="">All signal types</option>
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
              <option value="">All companies</option>
              {(payload.companies || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>

            <label style={styles.rangeFilter}>
              <span>Strength ≥ {filters.min_strength}</span>
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

            <label style={styles.checkFilter}>
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
              High intent
            </label>

            <button style={styles.clearButton} onClick={resetFilters}>
              Clear
            </button>
          </div>

          <div style={styles.signalList}>
            {loading ? (
              <Empty text="جارٍ تحميل الإشارات..." />
            ) : visibleSignals.length ? (
              visibleSignals.map((signal) => (
                <article key={signal.id} style={styles.signalRow}>
                  <div style={styles.signalIcon}>
                    <Activity size={17} />
                  </div>

                  <div style={styles.signalMain}>
                    <div style={styles.signalTitleRow}>
                      <div>
                        <b>{signal.title}</b>
                        <span style={styles.typeBadge}>
                          {labelType(signal.type)}
                        </span>
                      </div>
                      <span style={styles.date}>
                        {fmtDate(signal.detected_at)}
                      </span>
                    </div>

                    <p>
                      {signal.description ||
                        "لا يوجد وصف إضافي."}
                    </p>

                    <div style={styles.signalMeta}>
                      <button
                        style={styles.companyLink}
                        onClick={() =>
                          openCompany(signal.company?.id)
                        }
                      >
                        {signal.company?.name || "شركة غير معروفة"}
                      </button>
                      <span>
                        {[signal.company?.city, signal.company?.industry]
                          .filter(Boolean)
                          .join(" • ") || "الشركة"}
                      </span>
                      <span>Source: {signal.source || "—"}</span>
                    </div>
                  </div>

                  <div style={styles.scoreStack}>
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
            style={styles.backdrop}
            onMouseDown={() => setComposerOpen(false)}
          >
            <form
              style={styles.modal}
              onSubmit={submitSignal}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <div style={styles.eyebrow}>BUYING SIGNAL</div>
                  <h3>Add Market Signal</h3>
                </div>
                <button
                  type="button"
                  style={styles.iconButton}
                  onClick={() => setComposerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={styles.formGrid}>
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
                    <option value="">Select company</option>
                    {(payload.companies || []).map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="نوع الإشارة *">
                  <select
                    required
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value })
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
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Company announced a new branch"
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
                    placeholder="Evidence and context for this buying signal"
                  />
                </Field>

                <Field label={`Strength: ${form.strength}/100`}>
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

                <Field label={`Confidence: ${form.confidence}/100`}>
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
                      setForm({ ...form, source: e.target.value })
                    }
                    placeholder="manual, news, registry..."
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
                    placeholder="Optional evidence URL"
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

              <div style={styles.note}>
                Creating a signal automatically recalculates the
                company's Intent, Timing and Overall AI Score.
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={() => setComposerOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={saving}
                >
                  {saving ? "جارٍ الحفظ..." : "إنشاء إشارة"}
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
    <div style={styles.metric}>
      <div style={styles.metricIcon}>
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
    </div>
  );
}

function HealthRow({ label, value }) {
  return (
    <div style={styles.healthRow}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ScoreBox({ label, value }) {
  const score = Number(value || 0);
  return (
    <div style={styles.scoreBox}>
      <span>{label}</span>
      <b>{score}/100</b>
      <div style={styles.scoreTrack}>
        <i
          style={{
            ...styles.scoreFill,
            width: `${Math.max(0, Math.min(100, score))}%`,
          }}
        />
      </div>
    </div>
  );
}

function Field({ label, wide = false, children }) {
  return (
    <label
      style={{
        ...styles.field,
        ...(wide ? styles.fieldWide : {}),
      }}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }) {
  return <div style={styles.empty}>{text}</div>;
}

const styles = {
  page: { display: "grid", gap: 14 },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  eyebrow: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.1,
  },
  heading: {
    marginTop: 4,
    color: "#17213b",
    fontSize: 17,
    fontWeight: 800,
  },
  actions: { display: "flex", gap: 8 },
  primaryButton: {
    height: 38,
    padding: "0 14px",
    border: `1px solid ${PURPLE}`,
    borderRadius: 9,
    background: PURPLE,
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
  },
  secondaryButton: {
    height: 38,
    padding: "0 14px",
    border: "1px solid #dfe3eb",
    borderRadius: 9,
    background: "#fff",
    color: "#475467",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
  },
  error: {
    padding: 11,
    border: "1px solid #fecdd3",
    borderRadius: 10,
    background: "#fff1f2",
    color: "#be123c",
    fontSize: 12,
  },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0,1fr))",
    gap: 10,
  },
  metric: {
    padding: 14,
    border: "1px solid #e6e8f1",
    borderRadius: 14,
    background: "#fff",
    display: "flex",
    gap: 10,
  },
  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    background: "#f0edff",
    color: PURPLE,
    display: "grid",
    placeItems: "center",
  },
  radarGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1.5fr) minmax(280px,.6fr)",
    gap: 12,
  },
  panel: {
    border: "1px solid #e6e8f1",
    borderRadius: 14,
    background: "#fff",
    overflow: "hidden",
  },
  panelHeader: {
    minHeight: 58,
    padding: "0 15px",
    borderBottom: "1px solid #eef0f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: PURPLE,
  },
  typeGrid: {
    padding: 12,
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 8,
  },
  typeCard: {
    padding: 11,
    border: "1px solid #e7e9f0",
    borderRadius: 11,
    background: "#fff",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  typeCardActive: {
    borderColor: "#d8d2ff",
    background: "#faf9ff",
  },
  typeTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    color: "#344054",
  },
  typeStats: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 6,
    color: "#8b93a5",
    fontSize: 9,
  },
  track: {
    marginTop: 8,
    height: 5,
    background: "#eff1f6",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    display: "block",
    height: "100%",
    borderRadius: 999,
    background: PURPLE,
  },
  healthBody: { padding: 18, display: "grid", gap: 16 },
  ring: {
    width: 135,
    height: 135,
    margin: "4px auto",
    borderRadius: "50%",
    border: "13px solid #ece9ff",
    outline: `5px solid ${PURPLE}`,
    outlineOffset: -13,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  },
  healthRows: { display: "grid", gap: 8 },
  healthRow: {
    padding: "9px 0",
    borderBottom: "1px solid #f0f1f5",
    display: "flex",
    justifyContent: "space-between",
    color: "#667085",
    fontSize: 11,
  },
  feedPanel: {
    border: "1px solid #e6e8f1",
    borderRadius: 14,
    background: "#fff",
    overflow: "hidden",
  },
  feedHeader: {
    minHeight: 58,
    padding: "0 15px",
    borderBottom: "1px solid #eef0f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: PURPLE,
  },
  filters: {
    padding: 10,
    borderBottom: "1px solid #eef0f5",
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
    background: "#fafbff",
  },
  searchBox: {
    height: 35,
    minWidth: 240,
    padding: "0 10px",
    border: "1px solid #dfe3eb",
    borderRadius: 8,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  rangeFilter: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: "#667085",
    fontSize: 10,
  },
  checkFilter: {
    height: 35,
    padding: "0 9px",
    border: "1px solid #e4e7ec",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 10,
  },
  clearButton: {
    height: 35,
    padding: "0 10px",
    border: "1px solid #e4e7ec",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
  },
  signalList: { display: "grid" },
  signalRow: {
    padding: 14,
    borderBottom: "1px solid #f0f1f5",
    display: "grid",
    gridTemplateColumns: "38px minmax(0,1fr) 300px",
    gap: 12,
    alignItems: "start",
  },
  signalIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#f0edff",
    color: PURPLE,
    display: "grid",
    placeItems: "center",
  },
  signalMain: { minWidth: 0 },
  signalTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
  },
  typeBadge: {
    marginLeft: 8,
    padding: "3px 7px",
    borderRadius: 999,
    background: "#f0edff",
    color: PURPLE,
    fontSize: 9,
    fontWeight: 800,
  },
  date: { color: "#98a2b3", fontSize: 9 },
  signalMeta: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    color: "#8b93a5",
    fontSize: 9,
  },
  companyLink: {
    padding: 0,
    border: 0,
    background: "transparent",
    color: PURPLE,
    cursor: "pointer",
    fontWeight: 800,
  },
  scoreStack: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 7,
  },
  scoreBox: {
    padding: 8,
    borderRadius: 9,
    background: "#f8f9fc",
  },
  scoreTrack: {
    marginTop: 5,
    height: 4,
    borderRadius: 999,
    background: "#e9ebf1",
    overflow: "hidden",
  },
  scoreFill: {
    display: "block",
    height: "100%",
    background: PURPLE,
  },
  empty: {
    padding: 28,
    textAlign: "center",
    color: "#9299aa",
    fontSize: 12,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(16,24,40,.38)",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  modal: {
    width: "min(760px,96vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    borderRadius: 17,
    background: "#fff",
    boxShadow: "0 24px 70px rgba(16,24,40,.2)",
  },
  modalHeader: {
    padding: "17px 20px",
    borderBottom: "1px solid #eef0f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconButton: {
    width: 34,
    height: 34,
    border: "1px solid #e4e7ec",
    borderRadius: 9,
    background: "#fff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  },
  formGrid: {
    padding: 20,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 13,
  },
  field: {
    display: "grid",
    gap: 6,
    color: "#475467",
    fontSize: 11,
    fontWeight: 700,
  },
  fieldWide: { gridColumn: "1 / -1" },
  note: {
    margin: "0 20px 17px",
    padding: 11,
    borderRadius: 9,
    background: "#f7f5ff",
    color: "#6257a8",
    fontSize: 11,
  },
  modalFooter: {
    padding: "13px 20px",
    borderTop: "1px solid #eef0f5",
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
};
