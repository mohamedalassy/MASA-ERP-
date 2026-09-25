import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Shell,
  Btn,
  Kpi,
  Panel,
  Score,
  uiIcons,
} from "./shared";

import { aiSalesRequest } from "./aiSalesApi";

export default function Company360({
  onNavigate,
  activeView = "ai-sales-company",
}) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [converting, setConverting] =
    useState(false);
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Selected Company
  |--------------------------------------------------------------------------
  */

  function getStoredCompany() {
    try {
      const raw = sessionStorage.getItem(
        "ai-sales-selected-company"
      );

      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Company
  |--------------------------------------------------------------------------
  */

  async function loadCompany() {
    setLoading(true);
    setError("");

    const stored = getStoredCompany();

    if (!stored?.id) {
      setLoading(false);

      setError(
        "No company selected. Return to Discovered Leads and select a company."
      );

      return;
    }

    try {
      const data = await aiSalesRequest(
        `/companies/${stored.id}`
      );

      const result =
        data?.company ??
        data?.data ??
        data;

      setCompany(result);
    } catch (err) {
      console.error(
        "Failed to load Company 360:",
        err
      );

      /*
       * لو تحميل التفاصيل الكاملة فشل،
       * نعرض بيانات الشركة المحفوظة بدل
       * شاشة بيضاء.
       */
      setCompany(stored);

      setError(
        err.message ||
          "Unable to load full company intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompany();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Score
  |--------------------------------------------------------------------------
  */

  const scoreData = useMemo(() => {
    if (!company) {
      return {};
    }

    return (
      company.latest_score ??
      company.score ??
      company.scores?.[0] ??
      {}
    );
  }, [company]);

  const overallScore = Number(
    scoreData?.overall_score ??
      scoreData?.overall ??
      company?.overall_score ??
      0
  );

  /*
  |--------------------------------------------------------------------------
  | Signals
  |--------------------------------------------------------------------------
  */

  const signals = useMemo(() => {
    if (!company) {
      return [];
    }

    if (Array.isArray(company.signals)) {
      return company.signals;
    }

    if (
      Array.isArray(company.active_signals)
    ) {
      return company.active_signals;
    }

    return [];
  }, [company]);

  /*
  |--------------------------------------------------------------------------
  | Catalog Matches
  |--------------------------------------------------------------------------
  */

  const catalogMatches = useMemo(() => {
    if (!company) {
      return [];
    }

    if (
      Array.isArray(company.catalog_matches)
    ) {
      return company.catalog_matches;
    }

    if (
      Array.isArray(company.service_matches)
    ) {
      return company.service_matches;
    }

    const enrichment =
      company.enrichment ?? {};

    if (
      Array.isArray(
        enrichment?.matched_targets
      )
    ) {
      return enrichment.matched_targets;
    }

    return [];
  }, [company]);

  /*
  |--------------------------------------------------------------------------
  | Activities
  |--------------------------------------------------------------------------
  */

  const activities = useMemo(() => {
    if (!company) {
      return [];
    }

    if (Array.isArray(company.activities)) {
      return company.activities;
    }

    return [];
  }, [company]);

  /*
  |--------------------------------------------------------------------------
  | Existing Lead
  |--------------------------------------------------------------------------
  */

  const existingLead = useMemo(() => {
    if (!company) {
      return null;
    }

    if (company.lead) {
      return company.lead;
    }

    if (
      Array.isArray(company.leads) &&
      company.leads.length > 0
    ) {
      return company.leads[0];
    }

    return null;
  }, [company]);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function signalTitle(signal) {
    if (typeof signal === "string") {
      return signal;
    }

    return (
      signal.title ??
      signal.name ??
      signal.type ??
      "Buying signal"
    );
  }

  function matchTitle(match) {
    if (typeof match === "string") {
      return match;
    }

    if (typeof match === "number") {
      return `Catalog #${match}`;
    }

    return (
      match.name ??
      match.title ??
      match.product_name ??
      match.service_name ??
      "Catalog Match"
    );
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString();
  }

  /*
  |--------------------------------------------------------------------------
  | Convert Company To Lead
  |--------------------------------------------------------------------------
  */

  async function convertToLead() {
    if (!company?.id || converting) {
      return;
    }

    setConverting(true);
    setError("");
    setSuccess("");

    try {
      const data = await aiSalesRequest(
        `/companies/${company.id}/leads`,
        {
          method: "POST",

          body: JSON.stringify({
            status: "new",

            priority:
              overallScore >= 85
                ? "urgent"
                : overallScore >= 70
                  ? "high"
                  : overallScore >= 50
                    ? "medium"
                    : "low",

            notes:
              "Lead created from AI Sales Company 360.",
          }),
        }
      );

      const createdLead =
        data?.lead ??
        data?.data ??
        data;

      /*
       * حماية إضافية في حالة الـAPI
       * رجّع response غير متوقع.
       */
      if (!createdLead?.id) {
        throw new Error(
          "Lead was created but the API did not return a valid lead record."
        );
      }

      /*
       * تحديث Company 360 محليًا
       * بدون الحاجة لإعادة تحميل الصفحة.
       */
      setCompany((current) => ({
        ...current,

        status: "approved",

        lead: createdLead,

        leads: [
          ...(current?.leads || []),
          createdLead,
        ],
      }));

      /*
       * حفظ الـLead المختار لاستخدامه
       * في صفحة Lead Details.
       */
      sessionStorage.setItem(
        "ai-sales-selected-lead",
        JSON.stringify(createdLead)
      );

      setSuccess(
        `${company.name} converted to a lead successfully.`
      );
    } catch (err) {
      console.error(
        "Failed to convert company to lead:",
        err
      );

      setError(
        err.message ||
          "Unable to convert company to lead."
      );
    } finally {
      setConverting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Open Existing Lead
  |--------------------------------------------------------------------------
  */

  function openLead() {
    if (!existingLead) {
      return;
    }

    sessionStorage.setItem(
      "ai-sales-selected-lead",
      JSON.stringify(existingLead)
    );

    onNavigate?.("ai-sales-lead-detail");
  }

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <Shell
        activeView={activeView}
        onNavigate={onNavigate}
        title="ملف الشركة 360°"
        subtitle="جارٍ تحميل ذكاء الحساب..."
      >
        <div
          style={{
            padding: 40,
            textAlign: "center",
            opacity: 0.65,
          }}
        >
          Loading Company 360...
        </div>
      </Shell>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Company
  |--------------------------------------------------------------------------
  */

  if (!company) {
    return (
      <Shell
        activeView={activeView}
        onNavigate={onNavigate}
        title="ملف الشركة 360°"
        subtitle="كل ما يحتاجه فريق المبيعات قبل التواصل مع الحساب المستهدف."
      >
        <Panel title="الشركة">
          <div
            style={{
              padding: 30,
              textAlign: "center",
            }}
          >
            <strong>
              No company selected.
            </strong>

            <p>
              Select a company from Discovered
              Leads first.
            </p>

            <Btn
              onClick={() =>
                onNavigate?.(
                  "ai-sales-discovered"
                )
              }
            >
              Back to Discovered Leads
            </Btn>
          </div>
        </Panel>
      </Shell>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="ملف الشركة 360°"
      subtitle="كل ما يحتاجه فريق المبيعات قبل التواصل مع الحساب المستهدف."
    >
      <>
        {/* =====================================================
            Error
        ===================================================== */}

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: 13,
              borderRadius: 10,
              border:
                "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================================
            Success
        ===================================================== */}

        {success && (
          <div
            style={{
              marginBottom: 14,
              padding: 13,
              borderRadius: 10,
              border:
                "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
            }}
          >
            {success}
          </div>
        )}

        {/* =====================================================
            Account Hero
        ===================================================== */}

        <div className="account-hero">
          <div className="account-logo">
            <uiIcons.Building2 size={30} />
          </div>

          <div>
            <small>TARGET ACCOUNT</small>

            <h2>
              {company.name ||
                "شركة بدون اسم"}
            </h2>

            <p>
              <uiIcons.MapPin size={14} />

              {" "}

              {[
                company.city,
                company.region,
                company.industry,
              ]
                .filter(Boolean)
                .join(" • ") || "—"}
            </p>
          </div>

          <div className="account-score">
            <span>درجة الذكاء</span>

            <Score n={overallScore} />
          </div>

          {existingLead ? (
            <Btn onClick={openLead}>
              View Lead
            </Btn>
          ) : (
            <Btn
              onClick={convertToLead}
              disabled={converting}
            >
              {converting
                ? "جارٍ التحويل..."
                : "تحويل إلى عميل محتمل"}
            </Btn>
          )}
        </div>

        {/* =====================================================
            Score Breakdown
        ===================================================== */}

        <div className="mini-kpis">
          <Kpi
            type="companies"
            title="الملاءمة"
            value={
              scoreData?.fit_score ??
              scoreData?.fit ??
              0
            }
            delta=""
            note="ملاءمة الحساب"
          />

          <Kpi
            type="leads"
            title="النية"
            value={
              scoreData?.intent_score ??
              scoreData?.intent ??
              0
            }
            delta=""
            note="نية الشراء"
          />

          <Kpi
            type="opportunities"
            title="التوقيت"
            value={
              scoreData?.timing_score ??
              scoreData?.timing ??
              0
            }
            delta=""
            note="توقيت الشراء"
          />

          <Kpi
            type="rate"
            title="الثقة"
            value={
              scoreData?.confidence_score ??
              scoreData?.confidence ??
              company.data_confidence ??
              0
            }
            delta=""
            note="موثوقية البيانات"
          />
        </div>

        {/* =====================================================
            Intelligence
        ===================================================== */}

        <div className="workspace-3">
          <Panel title="إشارات الحساب">
            {signals.length ? (
              <div className="signal-list">
                {signals.map(
                  (signal, index) => (
                    <b
                      key={
                        signal?.id ??
                        `${signalTitle(
                          signal
                        )}-${index}`
                      }
                    >
                      {signalTitle(signal)}
                    </b>
                  )
                )}
              </div>
            ) : (
              <p>
                No verified buying signals
                detected yet.
              </p>
            )}
          </Panel>

          <Panel title="المنتجات والخدمات المقترحة">
            {catalogMatches.length ? (
              <>
                <div className="service-pills">
                  {catalogMatches.map(
                    (match, index) => (
                      <span
                        key={
                          match?.id ??
                          `${matchTitle(
                            match
                          )}-${index}`
                        }
                      >
                        {matchTitle(match)}
                      </span>
                    )
                  )}
                </div>

                <p>
                  Matches are based on the
                  selected ERP sales catalog
                  and available account data.
                </p>
              </>
            ) : (
              <p>
                No catalog recommendations
                available yet.
              </p>
            )}
          </Panel>

          <Panel title="أفضل إجراء تالٍ">
            {overallScore >= 85 ? (
              <>
                <h2>
                  Prioritize sales outreach
                </h2>

                <p>
                  This account currently has a
                  high AI score.
                </p>
              </>
            ) : overallScore >= 60 ? (
              <>
                <h2>
                  Research and qualify
                </h2>

                <p>
                  Validate the buying need and
                  identify relevant contacts.
                </p>
              </>
            ) : (
              <>
                <h2>
                  Continue monitoring
                </h2>

                <p>
                  More intent and timing data
                  is needed before prioritizing
                  outreach.
                </p>
              </>
            )}

            <Btn
              onClick={() =>
                onNavigate?.(
                  "ai-sales-message"
                )
              }
            >
              Prepare Outreach
            </Btn>
          </Panel>
        </div>

        {/* =====================================================
            Timeline + Intelligence
        ===================================================== */}

        <div className="workspace-2">
          <Panel title="الخط الزمني للفرصة">
            <div className="timeline">
              {activities.length ? (
                activities.map(
                  (activity, index) => (
                    <div
                      key={
                        activity.id ?? index
                      }
                    >
                      <i />

                      <span>
                        <b>
                          {activity.title ??
                            activity.type ??
                            "النشاط"}
                        </b>

                        <small>
                          {formatDate(
                            activity.created_at
                          )}
                        </small>
                      </span>
                    </div>
                  )
                )
              ) : (
                <>
                  <div>
                    <i />

                    <span>
                      <b>
                        Company discovered by AI
                      </b>

                      <small>
                        {formatDate(
                          company.discovered_at
                        )}
                      </small>
                    </span>
                  </div>

                  <div>
                    <i />

                    <span>
                      <b>
                        AI score calculated
                      </b>

                      <small>
                        Current score:{" "}
                        {overallScore}
                      </small>
                    </span>
                  </div>
                </>
              )}
            </div>
          </Panel>

          <Panel title="ذكاء الحساب">
            <div className="intel-grid">
              <span>
                <small>القطاع</small>

                <b>
                  {company.industry || "—"}
                </b>
              </span>

              <span>
                <small>الموقع</small>

                <b>
                  {[
                    company.city,
                    company.region,
                    company.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </b>
              </span>

              <span>
                <small>Website</small>

                <b>
                  {company.website || "—"}
                </b>
              </span>

              <span>
                <small>
                  Data Confidence
                </small>

                <b>
                  {company.data_confidence ??
                    scoreData?.confidence_score ??
                    0}
                  %
                </b>
              </span>

              <span>
                <small>الحالة</small>

                <b
                  style={{
                    textTransform:
                      "capitalize",
                  }}
                >
                  {company.status ||
                    "discovered"}
                </b>
              </span>

              <span>
                <small>المصدر</small>

                <b>
                  {company.source ||
                    company
                      ?.enrichment
                      ?.provider ||
                    "—"}
                </b>
              </span>
            </div>
          </Panel>
        </div>
      </>
    </Shell>
  );
}