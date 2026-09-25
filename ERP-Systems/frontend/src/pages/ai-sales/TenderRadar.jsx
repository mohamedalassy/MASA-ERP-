import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  ListChecks,
  PackageSearch,
  Save,
  ScanSearch,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import {
  Shell,
  Btn,
  Kpi,
  Panel,
  Score,
  uiIcons,
} from "./shared";

import { aiSalesRequest } from "./aiSalesApi";

export default function TenderRadar({
  onNavigate,
  activeView = "ai-sales-tenders",
}) {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showForm, setShowForm] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | AI Analysis
  |--------------------------------------------------------------------------
  */

  const [showAnalyzer, setShowAnalyzer] =
    useState(false);

  const [tenderText, setTenderText] =
    useState("");

  const [analyzing, setAnalyzing] =
    useState(false);

  const [analysis, setAnalysis] =
    useState(null);

  const [savingAnalysis, setSavingAnalysis] =
    useState(false);

  const [analysisForm, setAnalysisForm] =
    useState({
      title: "",
      issuer: "",
      reference: "",
      industry: "",
      region: "",
      source_url: "",
    });

  /*
  |--------------------------------------------------------------------------
  | Manual Form
  |--------------------------------------------------------------------------
  */

  const [form, setForm] = useState({
    title: "",
    issuer: "",
    reference: "",
    industry: "",
    region: "",
    estimated_value: "",
    currency: "SAR",
    deadline: "",
    fit_score: "",
    status: "open",
    source: "manual",
    source_url: "",
  });

  /*
  |--------------------------------------------------------------------------
  | Load
  |--------------------------------------------------------------------------
  */

  async function loadTenders() {
    setLoading(true);
    setError("");

    try {
      const response = await aiSalesRequest(
        "/tenders?per_page=100"
      );

      const rows = Array.isArray(response)
        ? response
        : response?.data ?? [];

      setTenders(rows);
    } catch (err) {
      console.error(
        "Failed to load AI Sales tenders:",
        err
      );

      setError(
        err.message ||
          "Unable to load tenders."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenders();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function formatMoney(
    value,
    currency = "SAR"
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return "—";
    }

    try {
      return new Intl.NumberFormat(
        "en-SA",
        {
          style: "currency",
          currency: currency || "SAR",
          maximumFractionDigits: 0,
        }
      ).format(amount);
    } catch {
      return `${
        currency || "SAR"
      } ${amount.toLocaleString()}`;
    }
  }

  function formatDate(value) {
    if (!value) {
      return "No deadline";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-GB"
    );
  }

  function daysUntil(value) {
    if (!value) {
      return null;
    }

    const deadline = new Date(value);

    if (
      Number.isNaN(
        deadline.getTime()
      )
    ) {
      return null;
    }

    const now = new Date();

    now.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return Math.ceil(
      (deadline.getTime() -
        now.getTime()) /
        86400000
    );
  }

  function deadlineLabel(value) {
    const days = daysUntil(value);

    if (days === null) {
      return "No deadline";
    }

    if (days < 0) {
      return `Expired ${Math.abs(
        days
      )} day${
        Math.abs(days) === 1
          ? ""
          : "s"
      } ago`;
    }

    if (days === 0) {
      return "Deadline today";
    }

    if (days === 1) {
      return "Deadline tomorrow";
    }

    return `Deadline in ${days} days`;
  }

  function statusLabel(value) {
    if (!value) {
      return "مفتوح";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function severityStyle(severity) {
    switch (
      String(
        severity || ""
      ).toLowerCase()
    ) {
      case "high":
        return {
          background: "#fef2f2",
          border: "#fecaca",
          color: "#b91c1c",
        };

      case "medium":
        return {
          background: "#fff7ed",
          border: "#fed7aa",
          color: "#c2410c",
        };

      default:
        return {
          background: "#f8fafc",
          border: "#e2e8f0",
          color: "#475569",
        };
    }
  }

  function fitLevelStyle(level) {
    switch (
      String(
        level || ""
      ).toLowerCase()
    ) {
      case "high":
        return {
          background: "#ecfdf5",
          color: "#047857",
          border: "#a7f3d0",
        };

      case "good":
        return {
          background: "#f0fdf4",
          color: "#15803d",
          border: "#bbf7d0",
        };

      case "medium":
        return {
          background: "#fff7ed",
          color: "#c2410c",
          border: "#fed7aa",
        };

      default:
        return {
          background: "#fef2f2",
          color: "#b91c1c",
          border: "#fecaca",
        };
    }
  }

  function fieldStyle() {
    return {
      width: "100%",
      marginTop: 6,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Stats
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    let potentialValue = 0;
    let highFit = 0;
    let open = 0;
    let urgent = 0;

    tenders.forEach((tender) => {
      const value = Number(
        tender.estimated_value ?? 0
      );

      const fit = Number(
        tender.fit_score ?? 0
      );

      const status = String(
        tender.status || "open"
      ).toLowerCase();

      const days = daysUntil(
        tender.deadline
      );

      if (
        Number.isFinite(value)
      ) {
        potentialValue += value;
      }

      if (fit >= 85) {
        highFit += 1;
      }

      if (
        ![
          "closed",
          "lost",
          "expired",
          "cancelled",
        ].includes(status)
      ) {
        open += 1;
      }

      if (
        days !== null &&
        days >= 0 &&
        days <= 7
      ) {
        urgent += 1;
      }
    });

    return {
      potentialValue,
      highFit,
      open,
      urgent,
    };
  }, [tenders]);

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const statuses = useMemo(() => {
    const values = new Set();

    tenders.forEach(
      (tender) => {
        if (tender.status) {
          values.add(
            tender.status
          );
        }
      }
    );

    return [...values];
  }, [tenders]);

  const filteredTenders =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      return tenders.filter(
        (tender) => {
          const matchesSearch =
            !query ||
            [
              tender.title,
              tender.issuer,
              tender.reference,
              tender.industry,
              tender.region,
              tender.source,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(query)
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            tender.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      tenders,
      search,
      statusFilter,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Analyze
  |--------------------------------------------------------------------------
  */

  async function analyzeTender() {
    const text =
      tenderText.trim();

    if (!text) {
      setError(
        "Paste the tender, RFQ, RFP or project scope before starting analysis."
      );
      return;
    }

    if (text.length < 20) {
      setError(
        "The tender text is too short for a useful analysis."
      );
      return;
    }

    setAnalyzing(true);
    setError("");
    setSuccess("");
    setAnalysis(null);

    try {
      const response =
        await aiSalesRequest(
          "/tenders/analyze-text",
          {
            method: "POST",
            body: JSON.stringify({
              text,
            }),
          }
        );

      setAnalysis(response);

      setSuccess(
        "Tender analysis completed. Review the intelligence before saving."
      );
    } catch (err) {
      console.error(
        "Tender analysis failed:",
        err
      );

      setError(
        err.message ||
          "Unable to analyze the tender."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function resetAnalyzer() {
    setTenderText("");
    setAnalysis(null);

    setAnalysisForm({
      title: "",
      issuer: "",
      reference: "",
      industry: "",
      region: "",
      source_url: "",
    });

    setError("");
    setSuccess("");
  }

  /*
  |--------------------------------------------------------------------------
  | Save Analyzed Tender
  |--------------------------------------------------------------------------
  */

  async function saveAnalyzedTender() {
    if (!analysis) {
      setError(
        "Analyze the tender before saving it."
      );
      return;
    }

    if (
      !analysisForm.title.trim()
    ) {
      setError(
        "Enter the tender or project title before saving."
      );
      return;
    }

    setSavingAnalysis(true);
    setError("");
    setSuccess("");

    try {
      const commercial =
        analysis?.commercial ||
        {};

      const dates =
        Array.isArray(
          analysis?.dates
        )
          ? analysis.dates
          : [];

      const payload = {
        title:
          analysisForm.title.trim(),

        issuer:
          analysisForm.issuer.trim() ||
          null,

        reference:
          analysisForm.reference.trim() ||
          null,

        industry:
          analysisForm.industry.trim() ||
          null,

        region:
          analysisForm.region.trim() ||
          null,

        estimated_value:
          commercial?.estimated_value ??
          null,

        currency:
          commercial?.currency ||
          "SAR",

        deadline:
          dates[0] || null,

        fit_score:
          Number.isFinite(
            Number(
              analysis?.fit_score
            )
          )
            ? Number(
                analysis.fit_score
              )
            : null,

        status: "reviewing",

        source: "ai_analysis",

        source_url:
          analysisForm.source_url.trim() ||
          null,

        matched_items:
          Array.isArray(
            analysis?.catalog_matches
          )
            ? analysis.catalog_matches
            : [],

        requirements:
          Array.isArray(
            analysis?.requirements
          )
            ? analysis.requirements
            : [],
      };

      const response =
        await aiSalesRequest(
          "/tenders",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );

      const created =
        response?.tender ??
        response?.data ??
        response;

      if (!created?.id) {
        throw new Error(
          "Tender was saved but the API did not return a valid record."
        );
      }

      setTenders(
        (current) => [
          created,
          ...current,
        ]
      );

      setAnalysis(null);
      setTenderText("");

      setAnalysisForm({
        title: "",
        issuer: "",
        reference: "",
        industry: "",
        region: "",
        source_url: "",
      });

      setShowAnalyzer(false);

      setSuccess(
        "Analyzed tender saved to Tender Radar successfully."
      );
    } catch (err) {
      console.error(
        "Failed to save analyzed tender:",
        err
      );

      setError(
        err.message ||
          "Unable to save the analyzed tender."
      );
    } finally {
      setSavingAnalysis(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Manual Create
  |--------------------------------------------------------------------------
  */

  async function createTender() {
    if (saving) {
      return;
    }

    if (!form.title.trim()) {
      setError(
        "Tender title is required."
      );
      return;
    }

    let estimatedValue = null;

    if (
      form.estimated_value !== ""
    ) {
      estimatedValue = Number(
        form.estimated_value
      );

      if (
        !Number.isFinite(
          estimatedValue
        ) ||
        estimatedValue < 0
      ) {
        setError(
          "Estimated value must be a valid positive number."
        );
        return;
      }
    }

    let fitScore = null;

    if (
      form.fit_score !== ""
    ) {
      fitScore = Number(
        form.fit_score
      );

      if (
        !Number.isInteger(
          fitScore
        ) ||
        fitScore < 0 ||
        fitScore > 100
      ) {
        setError(
          "AI fit score must be between 0 and 100."
        );
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title:
          form.title.trim(),

        issuer:
          form.issuer.trim() ||
          null,

        reference:
          form.reference.trim() ||
          null,

        industry:
          form.industry.trim() ||
          null,

        region:
          form.region.trim() ||
          null,

        estimated_value:
          estimatedValue,

        currency:
          form.currency ||
          "SAR",

        deadline:
          form.deadline ||
          null,

        fit_score:
          fitScore,

        status:
          form.status ||
          "open",

        source:
          form.source.trim() ||
          "manual",

        source_url:
          form.source_url.trim() ||
          null,
      };

      const response =
        await aiSalesRequest(
          "/tenders",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );

      const created =
        response?.tender ??
        response?.data ??
        response;

      if (!created?.id) {
        throw new Error(
          "Tender was created but the API did not return a valid record."
        );
      }

      setTenders(
        (current) => [
          created,
          ...current,
        ]
      );

      setForm({
        title: "",
        issuer: "",
        reference: "",
        industry: "",
        region: "",
        estimated_value: "",
        currency: "SAR",
        deadline: "",
        fit_score: "",
        status: "open",
        source: "manual",
        source_url: "",
      });

      setShowForm(false);

      setSuccess(
        "Tender added successfully."
      );
    } catch (err) {
      console.error(
        "Failed to create tender:",
        err
      );

      setError(
        err.message ||
          "Unable to create tender."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Analysis Data
  |--------------------------------------------------------------------------
  */

  const analysisRequirements =
    Array.isArray(
      analysis?.requirements
    )
      ? analysis.requirements
      : [];

  const catalogMatches =
    Array.isArray(
      analysis?.catalog_matches
    )
      ? analysis.catalog_matches
      : [];

  const analysisRisks =
    Array.isArray(
      analysis?.risks
    )
      ? analysis.risks
      : [];

  const analysisDates =
    Array.isArray(
      analysis?.dates
    )
      ? analysis.dates
      : [];

  const commercial =
    analysis?.commercial ||
    {};

  const recommendation =
    analysis?.recommendation ||
    {};

  const analysisMeta =
    analysis?.analysis_meta ||
    {};

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="المنافسات والمشاريع"
      subtitle="اكتشف المنافسات والمشاريع وحللها وقارنها بكتالوج ERP قبل تخصيص موارد المبيعات."
    >
      <>
        {/* Messages */}

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: 13,
              borderRadius: 10,
              border:
                "1px solid #fecaca",
              background:
                "#fef2f2",
              color: "#b91c1c",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: 14,
              padding: 13,
              borderRadius: 10,
              border:
                "1px solid #bbf7d0",
              background:
                "#f0fdf4",
              color: "#15803d",
              fontWeight: 600,
            }}
          >
            {success}
          </div>
        )}

        {/* KPIs */}

        <div className="mini-kpis">
          <Kpi
            type="opportunities"
            title="المنافسات المطابقة"
            value={tenders.length}
            delta=""
            note={`${stats.open} currently open`}
          />

          <Kpi
            type="pipeline"
            title="القيمة المحتملة"
            value={formatMoney(
              stats.potentialValue
            )}
            delta=""
            note="إجمالي قيمة المنافسات"
          />

          <Kpi
            type="rate"
            title="ملاءمة مرتفعة"
            value={stats.highFit}
            delta=""
            note="الدرجة ≥ 85"
          />

          <Kpi
            type="leads"
            title="مواعيد عاجلة"
            value={stats.urgent}
            delta=""
            note="خلال 7 أيام"
          />
        </div>

        {/* AI Intelligence Hero */}

        <div
          style={{
            marginBottom: 16,
            padding: 20,
            borderRadius: 16,
            border:
              "1px solid #e6e1ff",
            background:
              "linear-gradient(135deg, #faf9ff 0%, #f4f1ff 55%, #ffffff 100%)",
            display: "grid",
            gridTemplateColumns:
              "minmax(0,1fr) auto",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 15,
              alignItems:
                "flex-start",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 13,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                background:
                  "#6657F5",
                color: "#fff",
                boxShadow:
                  "0 10px 24px rgba(102,87,245,.22)",
              }}
            >
              <BrainCircuit
                size={23}
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems:
                    "center",
                  marginBottom: 4,
                }}
              >
                <strong
                  style={{
                    fontSize: 16,
                  }}
                >
                  AI Tender
                  Intelligence
                </strong>

                <span
                  style={{
                    padding:
                      "3px 7px",
                    borderRadius: 999,
                    background:
                      "#ede9fe",
                    color: "#6657F5",
                    fontSize: 10,
                    fontWeight: 900,
                  }}
                >
                  ERP AWARE
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  maxWidth: 760,
                  color: "#64748b",
                  lineHeight: 1.6,
                  fontSize: 13,
                }}
              >
                Analyze RFPs, RFQs,
                tenders and project
                scopes against your
                active ERP products
                and services.
              </p>
            </div>
          </div>

          <Btn
            onClick={() => {
              setShowAnalyzer(
                (current) =>
                  !current
              );

              setShowForm(false);
              setError("");
              setSuccess("");
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 7,
              }}
            >
              <ScanSearch
                size={16}
              />

              {showAnalyzer
                ? "إغلاق المحلل"
                : "تحليل المنافسة"}
            </span>
          </Btn>
        </div>

        {/* AI Analyzer */}

        {showAnalyzer && (
          <div
            style={{
              marginBottom: 18,
              border:
                "1px solid #e7e4f7",
              borderRadius: 16,
              overflow: "hidden",
              background: "#fff",
              boxShadow:
                "0 8px 28px rgba(15,23,42,.05)",
            }}
          >
            <div
              style={{
                padding:
                  "16px 18px",
                borderBottom:
                  "1px solid #eeeef5",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
                gap: 12,
                background:
                  "#fbfaff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: 10,
                }}
              >
                <Sparkles
                  size={19}
                  color="#6657F5"
                />

                <div>
                  <strong>
                    Tender Analysis
                    Workspace
                  </strong>

                  <div
                    style={{
                      fontSize: 11,
                      color:
                        "#64748b",
                      marginTop: 2,
                    }}
                  >
                    Document → ERP
                    Catalog → Fit →
                    Risk → Decision
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAnalyzer(
                    false
                  )
                }
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border:
                    "1px solid #e5e7eb",
                  background: "#fff",
                  display: "grid",
                  placeItems:
                    "center",
                  cursor:
                    "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    analysis
                      ? "minmax(300px,.8fr) minmax(0,1.2fr)"
                      : "1fr",
                  gap: 18,
                  alignItems:
                    "start",
                }}
              >
                {/* Text Input */}

                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: 13,
                        }}
                      >
                        Tender Document
                        Text
                      </strong>

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            "#64748b",
                          marginTop: 2,
                        }}
                      >
                        Paste the tender,
                        RFP, RFQ or scope
                        of work.
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 10,
                        color:
                          "#94a3b8",
                      }}
                    >
                      {
                        tenderText.length
                      }{" "}
                      / 200,000
                    </span>
                  </div>

                  <textarea
                    value={tenderText}
                    maxLength={200000}
                    placeholder={`Example:

Project: Enterprise Business Platform
Submission Deadline: 2026-10-30
Estimated Budget: SAR 500,000

The bidder shall provide, implement and support the required solution.
The solution must include the required products and services.
A performance bond is required.
The successful bidder shall provide 24/7 support.`}
                    onChange={(e) =>
                      setTenderText(
                        e.target.value
                      )
                    }
                    style={{
                      width: "100%",
                      minHeight:
                        analysis
                          ? 390
                          : 300,
                      resize:
                        "vertical",
                      padding: 14,
                      borderRadius: 10,
                      border:
                        "1px solid #dfe3ea",
                      outline: "none",
                      fontFamily:
                        "inherit",
                      lineHeight: 1.6,
                      fontSize: 13,
                      background:
                        "#fcfcfe",
                    }}
                  />

                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      gap: 8,
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <Btn
                      onClick={
                        analyzeTender
                      }
                      disabled={
                        analyzing
                      }
                    >
                      <span
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 7,
                        }}
                      >
                        <BrainCircuit
                          size={16}
                        />

                        {analyzing
                          ? "جارٍ التحليل..."
                          : analysis
                            ? "إعادة التحليل"
                            : "تحليل مقابل كتالوج ERP"}
                      </span>
                    </Btn>

                    {(tenderText ||
                      analysis) && (
                      <Btn
                        secondary
                        onClick={
                          resetAnalyzer
                        }
                        disabled={
                          analyzing
                        }
                      >
                        Clear
                      </Btn>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: 13,
                      padding: 11,
                      borderRadius: 9,
                      background:
                        "#f8fafc",
                      border:
                        "1px solid #eef2f7",
                      display: "flex",
                      gap: 8,
                      alignItems:
                        "flex-start",
                      color:
                        "#64748b",
                      fontSize: 11,
                      lineHeight: 1.5,
                    }}
                  >
                    <AlertTriangle
                      size={15}
                      style={{
                        flexShrink: 0,
                      }}
                    />

                    <span>
                      Analysis is
                      decision support.
                      Human review is
                      required before
                      submitting a bid
                      or making a
                      commercial
                      commitment.
                    </span>
                  </div>
                </div>

                {/* Results */}

                {analysis && (
                  <div
                    style={{
                      display: "grid",
                      gap: 12,
                    }}
                  >
                    {/* Score */}

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border:
                          "1px solid #e7e4f7",
                        background:
                          "#faf9ff",
                        display: "grid",
                        gridTemplateColumns:
                          "auto 1fr auto",
                        alignItems:
                          "center",
                        gap: 14,
                      }}
                    >
                      <Score
                        n={Number(
                          analysis.fit_score ??
                            0
                        )}
                      />

                      <div>
                        <small>
                          ERP FIT SCORE
                        </small>

                        <div
                          style={{
                            fontSize: 20,
                            fontWeight:
                              900,
                          }}
                        >
                          {Number(
                            analysis.fit_score ??
                              0
                          )}
                          /100
                        </div>

                        <span
                          style={{
                            display:
                              "inline-flex",
                            marginTop: 5,
                            padding:
                              "4px 8px",
                            borderRadius:
                              999,
                            fontSize: 10,
                            fontWeight:
                              900,
                            textTransform:
                              "uppercase",
                            border: `1px solid ${
                              fitLevelStyle(
                                analysis.fit_level
                              ).border
                            }`,
                            background:
                              fitLevelStyle(
                                analysis.fit_level
                              )
                                .background,
                            color:
                              fitLevelStyle(
                                analysis.fit_level
                              ).color,
                          }}
                        >
                          {analysis.fit_level ||
                            "unknown"}{" "}
                          fit
                        </span>
                      </div>

                      <div
                        style={{
                          textAlign:
                            "right",
                        }}
                      >
                        <small>
                          REQUIREMENTS
                        </small>

                        <div
                          style={{
                            fontSize: 20,
                            fontWeight:
                              900,
                          }}
                        >
                          {analysis.requirements_detected ??
                            analysisRequirements.length}
                        </div>
                      </div>
                    </div>

                    {/* Recommendation */}

                    <div
                      style={{
                        padding: 14,
                        borderRadius: 11,
                        border:
                          recommendation.action ===
                          "pursue"
                            ? "1px solid #bbf7d0"
                            : "1px solid #ddd6fe",
                        background:
                          recommendation.action ===
                          "pursue"
                            ? "#f0fdf4"
                            : "#faf9ff",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 8,
                          alignItems:
                            "center",
                          marginBottom: 5,
                        }}
                      >
                        <CheckCircle2
                          size={16}
                          color={
                            recommendation.action ===
                            "pursue"
                              ? "#15803d"
                              : "#6657F5"
                          }
                        />

                        <strong>
                          {recommendation.label ||
                            "مراجعة بشرية مطلوبة"}
                        </strong>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          lineHeight: 1.6,
                          color:
                            "#475569",
                        }}
                      >
                        {recommendation.reason ||
                          "راجع التحليل قبل اتخاذ قرار تجاري."}
                      </p>
                    </div>

                    {/* Summary */}

                    <div
                      style={{
                        padding: 14,
                        border:
                          "1px solid #ececf3",
                        borderRadius: 11,
                      }}
                    >
                      <strong>
                        Executive Summary
                      </strong>

                      <p
                        style={{
                          margin:
                            "8px 0 0",
                          fontSize: 12,
                          lineHeight: 1.7,
                          color:
                            "#475569",
                          maxHeight: 150,
                          overflow: "auto",
                        }}
                      >
                        {analysis.summary ||
                          "لا يوجد ملخص متاح."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Intelligence */}

              {analysis && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(2,minmax(0,1fr))",
                      gap: 12,
                      marginTop: 18,
                    }}
                  >
                    {/* Commercial */}

                    <div
                      style={{
                        padding: 15,
                        border:
                          "1px solid #ececf3",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems:
                            "center",
                          marginBottom: 12,
                        }}
                      >
                        <Target
                          size={17}
                          color="#6657F5"
                        />

                        <strong>
                          Commercial
                          Intelligence
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div>
                          <small>
                            ESTIMATED VALUE
                          </small>

                          <div
                            style={{
                              marginTop: 4,
                              fontWeight:
                                900,
                              fontSize: 16,
                            }}
                          >
                            {formatMoney(
                              commercial.estimated_value,
                              commercial.currency ||
                                "SAR"
                            )}
                          </div>
                        </div>

                        <div>
                          <small>
                            CURRENCY
                          </small>

                          <div
                            style={{
                              marginTop: 4,
                              fontWeight:
                                800,
                            }}
                          >
                            {commercial.currency ||
                              "غير مكتشف"}
                          </div>
                        </div>

                        <div
                          style={{
                            gridColumn:
                              "1 / -1",
                          }}
                        >
                          <small>
                            DETECTED DATES
                          </small>

                          <div
                            style={{
                              display:
                                "flex",
                              flexWrap:
                                "wrap",
                              gap: 6,
                              marginTop: 7,
                            }}
                          >
                            {analysisDates.length ? (
                              analysisDates.map(
                                (
                                  date,
                                  index
                                ) => (
                                  <span
                                    key={`${date}-${index}`}
                                    style={{
                                      padding:
                                        "5px 8px",
                                      borderRadius:
                                        999,
                                      background:
                                        "#f1efff",
                                      color:
                                        "#6657F5",
                                      fontSize:
                                        11,
                                      fontWeight:
                                        700,
                                    }}
                                  >
                                    {date}
                                  </span>
                                )
                              )
                            ) : (
                              <span
                                style={{
                                  color:
                                    "#94a3b8",
                                  fontSize:
                                    12,
                                }}
                              >
                                No structured
                                dates detected.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Engine */}

                    <div
                      style={{
                        padding: 15,
                        border:
                          "1px solid #ececf3",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems:
                            "center",
                          marginBottom: 12,
                        }}
                      >
                        <BrainCircuit
                          size={17}
                          color="#6657F5"
                        />

                        <strong>
                          Analysis Engine
                        </strong>
                      </div>

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <div>
                          <small>
                            ENGINE
                          </small>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight:
                                800,
                            }}
                          >
                            {analysisMeta.engine ||
                              "—"}
                          </div>
                        </div>

                        <div>
                          <small>
                            CATALOG SCANNED
                          </small>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight:
                                800,
                            }}
                          >
                            {analysisMeta.catalog_profiles_scanned ??
                              0}
                          </div>
                        </div>

                        <div>
                          <small>
                            MATCHES
                          </small>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight:
                                800,
                            }}
                          >
                            {analysisMeta.matched_catalog_profiles ??
                              catalogMatches.length}
                          </div>
                        </div>

                        <div>
                          <small>
                            RISKS
                          </small>
                          <div
                            style={{
                              marginTop: 4,
                              fontWeight:
                                800,
                            }}
                          >
                            {analysisMeta.risk_count ??
                              analysisRisks.length}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements + Matches */}

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1fr 1fr",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: 15,
                        border:
                          "1px solid #ececf3",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <ListChecks
                          size={17}
                          color="#6657F5"
                        />

                        <strong>
                          Detected
                          Requirements
                        </strong>

                        <span
                          style={{
                            marginLeft:
                              "auto",
                            fontSize: 11,
                            color:
                              "#64748b",
                          }}
                        >
                          {
                            analysisRequirements.length
                          }
                        </span>
                      </div>

                      {analysisRequirements.length ? (
                        <div
                          style={{
                            display:
                              "grid",
                            gap: 7,
                            maxHeight: 260,
                            overflow:
                              "auto",
                          }}
                        >
                          {analysisRequirements.map(
                            (
                              requirement,
                              index
                            ) => (
                              <div
                                key={index}
                                style={{
                                  padding:
                                    "9px 10px",
                                  background:
                                    "#fafafa",
                                  border:
                                    "1px solid #f0f0f3",
                                  borderRadius:
                                    8,
                                  fontSize:
                                    11,
                                  lineHeight:
                                    1.5,
                                  color:
                                    "#475569",
                                }}
                              >
                                <b
                                  style={{
                                    color:
                                      "#6657F5",
                                    marginRight:
                                      6,
                                  }}
                                >
                                  #
                                  {index +
                                    1}
                                </b>

                                {requirement}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p
                          style={{
                            color:
                              "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          No explicit
                          requirements
                          were extracted.
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        padding: 15,
                        border:
                          "1px solid #ececf3",
                        borderRadius: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <PackageSearch
                          size={17}
                          color="#6657F5"
                        />

                        <strong>
                          ERP Catalog
                          Matches
                        </strong>

                        <span
                          style={{
                            marginLeft:
                              "auto",
                            fontSize: 11,
                            color:
                              "#64748b",
                          }}
                        >
                          {
                            catalogMatches.length
                          }
                        </span>
                      </div>

                      {catalogMatches.length ? (
                        <div
                          style={{
                            display:
                              "grid",
                            gap: 8,
                            maxHeight: 260,
                            overflow:
                              "auto",
                          }}
                        >
                          {catalogMatches.map(
                            (
                              match,
                              index
                            ) => (
                              <div
                                key={
                                  match.id ??
                                  index
                                }
                                style={{
                                  padding: 11,
                                  border:
                                    "1px solid #ebe8ff",
                                  background:
                                    "#faf9ff",
                                  borderRadius:
                                    9,
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    justifyContent:
                                      "space-between",
                                    gap: 10,
                                  }}
                                >
                                  <div>
                                    <strong
                                      style={{
                                        fontSize:
                                          12,
                                      }}
                                    >
                                      {match.name ||
                                        "عنصر الكتالوج"}
                                    </strong>

                                    <div
                                      style={{
                                        marginTop:
                                          2,
                                        fontSize:
                                          10,
                                        color:
                                          "#64748b",
                                        textTransform:
                                          "uppercase",
                                      }}
                                    >
                                      {match.type ||
                                        "catalog"}
                                    </div>
                                  </div>

                                  <span
                                    style={{
                                      color:
                                        "#6657F5",
                                      fontWeight:
                                        900,
                                      fontSize:
                                        12,
                                    }}
                                  >
                                    {Number(
                                      match.confidence ??
                                        0
                                    )}
                                    %
                                  </span>
                                </div>

                                {Array.isArray(
                                  match.matched_keywords
                                ) &&
                                  match
                                    .matched_keywords
                                    .length >
                                    0 && (
                                    <div
                                      style={{
                                        display:
                                          "flex",
                                        flexWrap:
                                          "wrap",
                                        gap: 5,
                                        marginTop:
                                          8,
                                      }}
                                    >
                                      {match.matched_keywords.map(
                                        (
                                          keyword,
                                          keywordIndex
                                        ) => (
                                          <span
                                            key={`${keyword}-${keywordIndex}`}
                                            style={{
                                              padding:
                                                "3px 6px",
                                              borderRadius:
                                                999,
                                              background:
                                                "#ede9fe",
                                              color:
                                                "#6657F5",
                                              fontSize:
                                                9,
                                              fontWeight:
                                                700,
                                            }}
                                          >
                                            {
                                              keyword
                                            }
                                          </span>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <p
                          style={{
                            color:
                              "#94a3b8",
                            fontSize: 12,
                          }}
                        >
                          No active ERP
                          catalog profile
                          matched this
                          document.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Risks */}

                  <div
                    style={{
                      marginTop: 12,
                      padding: 15,
                      border:
                        "1px solid #ececf3",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems:
                          "center",
                        marginBottom: 12,
                      }}
                    >
                      <AlertTriangle
                        size={17}
                        color="#f59e0b"
                      />

                      <strong>
                        Risks & Review
                        Flags
                      </strong>

                      <span
                        style={{
                          marginLeft:
                            "auto",
                          fontSize: 11,
                          color:
                            "#64748b",
                        }}
                      >
                        {
                          analysisRisks.length
                        }{" "}
                        detected
                      </span>
                    </div>

                    {analysisRisks.length ? (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(2,minmax(0,1fr))",
                          gap: 8,
                        }}
                      >
                        {analysisRisks.map(
                          (
                            risk,
                            index
                          ) => {
                            const style =
                              severityStyle(
                                risk.severity
                              );

                            return (
                              <div
                                key={
                                  index
                                }
                                style={{
                                  padding:
                                    10,
                                  borderRadius:
                                    9,
                                  border: `1px solid ${style.border}`,
                                  background:
                                    style.background,
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",
                                    justifyContent:
                                      "space-between",
                                    gap: 8,
                                    marginBottom:
                                      4,
                                  }}
                                >
                                  <strong
                                    style={{
                                      color:
                                        style.color,
                                      fontSize:
                                        11,
                                      textTransform:
                                        "capitalize",
                                    }}
                                  >
                                    {risk.type ||
                                      "المخاطر"}
                                  </strong>

                                  <span
                                    style={{
                                      color:
                                        style.color,
                                      fontSize:
                                        9,
                                      fontWeight:
                                        900,
                                      textTransform:
                                        "uppercase",
                                    }}
                                  >
                                    {risk.severity ||
                                      "low"}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    color:
                                      "#475569",
                                    fontSize:
                                      11,
                                    lineHeight:
                                      1.5,
                                  }}
                                >
                                  {risk.message ||
                                    "المراجعة مطلوبة."}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          color:
                            "#15803d",
                          fontSize: 12,
                          display: "flex",
                          alignItems:
                            "center",
                          gap: 7,
                        }}
                      >
                        <CheckCircle2
                          size={15}
                        />

                        No rule-based
                        risk flags were
                        detected.
                      </div>
                    )}
                  </div>

                  {/* Save Form */}

                  <div
                    style={{
                      marginTop: 12,
                      padding: 16,
                      borderRadius: 12,
                      background:
                        "#faf9ff",
                      border:
                        "1px solid #e7e4f7",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        marginBottom: 14,
                      }}
                    >
                      <Save
                        size={17}
                        color="#6657F5"
                      />

                      <div>
                        <strong>
                          Save to Tender
                          Radar
                        </strong>

                        <div
                          style={{
                            fontSize: 11,
                            color:
                              "#64748b",
                            marginTop: 2,
                          }}
                        >
                          Confirm the
                          tender identity
                          before creating
                          the ERP record.
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3,minmax(0,1fr))",
                        gap: 10,
                      }}
                    >
                      <label
                        style={{
                          gridColumn:
                            "span 2",
                        }}
                      >
                        <small>
                          Tender /
                          Project Title *
                        </small>

                        <input
                          value={
                            analysisForm.title
                          }
                          placeholder="عنوان المنافسة"
                          onChange={(e) =>
                            setAnalysisForm(
                              (
                                current
                              ) => ({
                                ...current,
                                title:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={fieldStyle()}
                        />
                      </label>

                      <label>
                        <small>
                          Reference
                        </small>

                        <input
                          value={
                            analysisForm.reference
                          }
                          placeholder="المرجع"
                          onChange={(e) =>
                            setAnalysisForm(
                              (
                                current
                              ) => ({
                                ...current,
                                reference:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={fieldStyle()}
                        />
                      </label>

                      <label>
                        <small>
                          Issuer
                        </small>

                        <input
                          value={
                            analysisForm.issuer
                          }
                          placeholder="الجهة الطارحة"
                          onChange={(e) =>
                            setAnalysisForm(
                              (
                                current
                              ) => ({
                                ...current,
                                issuer:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={fieldStyle()}
                        />
                      </label>

                      <label>
                        <small>
                          Industry
                        </small>

                        <input
                          value={
                            analysisForm.industry
                          }
                          placeholder="القطاع"
                          onChange={(e) =>
                            setAnalysisForm(
                              (
                                current
                              ) => ({
                                ...current,
                                industry:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={fieldStyle()}
                        />
                      </label>

                      <label>
                        <small>
                          Region
                        </small>

                        <input
                          value={
                            analysisForm.region
                          }
                          placeholder="المنطقة"
                          onChange={(e) =>
                            setAnalysisForm(
                              (
                                current
                              ) => ({
                                ...current,
                                region:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={fieldStyle()}
                        />
                      </label>

                      <label
                        style={{
                          gridColumn:
                            "span 2",
                        }}
                      >
                        <small>
                          Source URL
                        </small>

                        <input
                          value={
                            analysisForm.source_url
                          }
                          placeholder="رابط مصدر المنافسة"
                          onChange={(e) =>
                            setAnalysisForm(
                              (
                                current
                              ) => ({
                                ...current,
                                source_url:
                                  e
                                    .target
                                    .value,
                              })
                            )
                          }
                          style={fieldStyle()}
                        />
                      </label>

                      <div
                        style={{
                          display: "grid",
                          alignItems:
                            "end",
                        }}
                      >
                        <Btn
                          onClick={
                            saveAnalyzedTender
                          }
                          disabled={
                            savingAnalysis
                          }
                        >
                          <span
                            style={{
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              gap: 7,
                            }}
                          >
                            <Save
                              size={15}
                            />

                            {savingAnalysis
                              ? "جارٍ الحفظ..."
                              : "حفظ المنافسة المحللة"}
                          </span>
                        </Btn>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tender Radar */}

        <Panel
          title="ذكاء المنافسات"
          action={
            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={
                  loadTenders
                }
                disabled={loading}
                style={{
                  border: 0,
                  background:
                    "transparent",
                  color: "#6657F5",
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                  fontWeight: 800,
                }}
              >
                {loading
                  ? "جارٍ التحميل..."
                  : "تحديث"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(
                    (current) =>
                      !current
                  );

                  setShowAnalyzer(
                    false
                  );

                  setError("");
                  setSuccess("");
                }}
                style={{
                  border: 0,
                  background:
                    "transparent",
                  color: "#6657F5",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {showForm
                  ? "إلغاء"
                  : "+ إضافة منافسة"}
              </button>
            </div>
          }
        >
          {/* Manual Form */}

          {showForm && (
            <div
              style={{
                marginBottom: 18,
                padding: 16,
                background:
                  "#faf9ff",
                border:
                  "1px solid #ebe8ff",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(3,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label
                  style={{
                    gridColumn:
                      "span 2",
                  }}
                >
                  <small>
                    Tender / Project
                    Title *
                  </small>

                  <input
                    type="text"
                    value={
                      form.title
                    }
                    placeholder="أدخل عنوان المنافسة"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          title:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Reference
                  </small>

                  <input
                    type="text"
                    value={
                      form.reference
                    }
                    placeholder="مرجع المنافسة"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          reference:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Issuer
                  </small>

                  <input
                    type="text"
                    value={
                      form.issuer
                    }
                    placeholder="الجهة الطارحة"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          issuer:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Industry
                  </small>

                  <input
                    type="text"
                    value={
                      form.industry
                    }
                    placeholder="Industry / sector"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          industry:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Region
                  </small>

                  <input
                    type="text"
                    value={
                      form.region
                    }
                    placeholder="المنطقة"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          region:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Estimated Value
                  </small>

                  <input
                    type="number"
                    min="0"
                    value={
                      form.estimated_value
                    }
                    placeholder="250000"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          estimated_value:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Currency
                  </small>

                  <select
                    value={
                      form.currency
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          currency:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  >
                    <option value="SAR">
                      SAR
                    </option>
                    <option value="USD">
                      USD
                    </option>
                    <option value="AED">
                      AED
                    </option>
                    <option value="EUR">
                      EUR
                    </option>
                  </select>
                </label>

                <label>
                  <small>
                    Deadline
                  </small>

                  <input
                    type="date"
                    value={
                      form.deadline
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          deadline:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    AI Fit Score
                  </small>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={
                      form.fit_score
                    }
                    placeholder="0 - 100"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          fit_score:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label>
                  <small>
                    Status
                  </small>

                  <select
                    value={
                      form.status
                    }
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  >
                    <option value="open">
                      Open
                    </option>
                    <option value="reviewing">
                      Reviewing
                    </option>
                    <option value="qualified">
                      Qualified
                    </option>
                    <option value="submitted">
                      Submitted
                    </option>
                    <option value="won">
                      Won
                    </option>
                    <option value="lost">
                      Lost
                    </option>
                    <option value="expired">
                      Expired
                    </option>
                  </select>
                </label>

                <label>
                  <small>
                    Source
                  </small>

                  <input
                    type="text"
                    value={
                      form.source
                    }
                    placeholder="manual"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          source:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>

                <label
                  style={{
                    gridColumn:
                      "span 2",
                  }}
                >
                  <small>
                    Source URL
                  </small>

                  <input
                    type="text"
                    value={
                      form.source_url
                    }
                    placeholder="رابط مصدر المنافسة"
                    onChange={(e) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          source_url:
                            e.target
                              .value,
                        })
                      )
                    }
                    style={fieldStyle()}
                  />
                </label>
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  justifyContent:
                    "flex-end",
                  gap: 8,
                }}
              >
                <Btn
                  secondary
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                >
                  Cancel
                </Btn>

                <Btn
                  onClick={
                    createTender
                  }
                  disabled={saving}
                >
                  {saving
                    ? "جارٍ الحفظ..."
                    : "إضافة منافسة"}
                </Btn>
              </div>
            </div>
          )}

          {/* Filters */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 190px",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                position:
                  "relative",
              }}
            >
              <uiIcons.Search
                size={17}
                style={{
                  position:
                    "absolute",
                  left: 13,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.45,
                }}
              />

              <input
                type="text"
                value={search}
                placeholder="ابحث في المنافسات أو الجهات أو المراجع أو القطاعات أو المناطق..."
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  paddingLeft: 40,
                }}
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="all">
                All Statuses
              </option>

              {statuses.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {statusLabel(
                      status
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Tender List */}

          {loading ? (
            <div
              style={{
                padding: 45,
                textAlign:
                  "center",
                opacity: 0.65,
              }}
            >
              Loading Tender
              Intelligence...
            </div>
          ) : filteredTenders.length ===
            0 ? (
            <div
              style={{
                padding: 50,
                textAlign:
                  "center",
              }}
            >
              <FileSearch
                size={38}
                style={{
                  opacity: 0.3,
                }}
              />

              <h3>
                {tenders.length
                  ? "لا توجد منافسات مطابقة"
                  : "لا توجد منافسات حتى الآن"}
              </h3>

              <p>
                {tenders.length
                  ? "غيّر البحث أو فلتر الحالة."
                  : "Analyze a tender against your ERP catalog or add one manually."}
              </p>

              {!tenders.length && (
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "center",
                    gap: 8,
                  }}
                >
                  <Btn
                    onClick={() => {
                      setShowAnalyzer(
                        true
                      );
                      setShowForm(
                        false
                      );
                    }}
                  >
                    Analyze Tender
                  </Btn>

                  <Btn
                    secondary
                    onClick={() =>
                      setShowForm(
                        true
                      )
                    }
                  >
                    Add Manually
                  </Btn>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              {filteredTenders.map(
                (tender) => {
                  const days =
                    daysUntil(
                      tender.deadline
                    );

                  return (
                    <div
                      className="tender-row"
                      key={
                        tender.id
                      }
                    >
                      <span className="tender-icon">
                        <Target
                          size={20}
                        />
                      </span>

                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <b>
                          {
                            tender.title
                          }
                        </b>

                        <small>
                          {[
                            tender.issuer,
                            tender.region,
                            tender.industry,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              " • "
                            ) ||
                            "Tender opportunity"}
                        </small>

                        <small
                          style={{
                            marginTop: 3,
                          }}
                        >
                          {tender.reference
                            ? `${tender.reference} • `
                            : ""}

                          {deadlineLabel(
                            tender.deadline
                          )}
                        </small>
                      </div>

                      <Score
                        n={Number(
                          tender.fit_score ??
                            0
                        )}
                      />

                      <strong>
                        {formatMoney(
                          tender.estimated_value,
                          tender.currency
                        )}
                      </strong>

                      <span
                        style={{
                          padding:
                            "5px 9px",
                          borderRadius:
                            999,
                          background:
                            days !==
                              null &&
                            days >= 0 &&
                            days <= 7
                              ? "#fff7ed"
                              : "#f1efff",
                          color:
                            days !==
                              null &&
                            days >= 0 &&
                            days <= 7
                              ? "#c2410c"
                              : "#6657F5",
                          fontSize: 11,
                          fontWeight:
                            800,
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {statusLabel(
                          tender.status
                        )}
                      </span>

                      {tender.source_url ? (
                        <Btn
                          secondary
                          onClick={() =>
                            window.open(
                              tender.source_url,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          Source
                        </Btn>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            opacity: 0.5,
                          }}
                        >
                          {formatDate(
                            tender.deadline
                          )}
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* Footer */}

          {!loading &&
            tenders.length >
              0 && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop:
                    "1px solid #eeeef3",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  opacity: 0.65,
                }}
              >
                <span>
                  {
                    filteredTenders.length
                  }{" "}
                  of{" "}
                  {tenders.length}{" "}
                  tenders
                </span>

                <span>
                  AI Sales Tender
                  Intelligence
                </span>
              </div>
            )}
        </Panel>
      </>
    </Shell>
  );
}