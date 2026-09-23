import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Shell,
  Btn,
  Panel,
  Score,
  uiIcons,
} from "./shared";

const API =
  "http://127.0.0.1:8000/api/ai-sales";

export default function Company360({
  onNavigate,
 activeView = "ai-sales-company",
}) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [converting, setConverting] = useState(false);
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | API
  |--------------------------------------------------------------------------
  */

  async function request(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed (${response.status})`
      );
    }

    return data;
  }

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
  | Load Company 360
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
      const data = await request(
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
       * Keep the company selected from the table visible
       * even if the detail endpoint fails.
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
  | Normalizers
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
      /*
       * This endpoint may need to be aligned with the
       * current LeadController route.
       */
      const data = await request("/leads", {
        method: "POST",

        body: JSON.stringify({
          company_id: company.id,
          source: "ai_sales",
          status: "new",
        }),
      });

      setSuccess(
        data?.message ||
          "Company converted to lead successfully."
      );

      setCompany((current) => ({
        ...current,
        lead:
          data?.lead ??
          data?.data ??
          current?.lead,
      }));
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
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <Shell
        activeView={activeView}
        onNavigate={onNavigate}
        title="Company 360"
        subtitle="Loading account intelligence..."
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
        title="Company 360"
        subtitle="Everything your sales team needs before contacting a target account."
      >
        <Panel title="Company">
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
      title="Company 360"
      subtitle="Everything your sales team needs before contacting a target account."
    >
      <>
        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: 13,
              borderRadius: 10,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
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
              border: "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#166534",
            }}
          >
            {success}
          </div>
        )}

        {/* ACCOUNT HERO */}

        <div className="account-hero">
          <div className="account-logo">
            <uiIcons.Building2 size={30} />
          </div>

          <div>
            <small>TARGET ACCOUNT</small>

            <h2>
              {company.name ||
                "Unnamed Company"}
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
            <span>AI Score</span>

            <Score n={overallScore} />
          </div>

          {company.lead ? (
            <Btn
              onClick={() =>
                onNavigate?.("ai-sales-leads")
              }
            >
              View Lead
            </Btn>
          ) : (
            <Btn
              onClick={convertToLead}
              disabled={converting}
            >
              {converting
                ? "Converting..."
                : "Convert to Lead"}
            </Btn>
          )}
        </div>

        {/* SCORE BREAKDOWN */}

        <div className="mini-kpis">
          <Kpi
            type="companies"
            title="Fit"
            value={
              scoreData?.fit_score ??
              scoreData?.fit ??
              0
            }
            delta=""
            note="Account fit"
          />

          <Kpi
            type="leads"
            title="Intent"
            value={
              scoreData?.intent_score ??
              scoreData?.intent ??
              0
            }
            delta=""
            note="Buying intent"
          />

          <Kpi
            type="opportunities"
            title="Timing"
            value={
              scoreData?.timing_score ??
              scoreData?.timing ??
              0
            }
            delta=""
            note="Buying timing"
          />

          <Kpi
            type="rate"
            title="Confidence"
            value={
              scoreData?.confidence_score ??
              scoreData?.confidence ??
              company.data_confidence ??
              0
            }
            delta=""
            note="Data confidence"
          />
        </div>

        {/* INTELLIGENCE */}

        <div className="workspace-3">
          <Panel title="Account Signals">
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

          <Panel title="Recommended Products & Services">
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

          <Panel title="Next Best Action">
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
                  "ai-sales-message-composer"
                )
              }
            >
              Prepare Outreach
            </Btn>
          </Panel>
        </div>

        {/* TIMELINE + ACCOUNT DATA */}

        <div className="workspace-2">
          <Panel title="Opportunity Timeline">
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
                            "Activity"}
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

          <Panel title="Account Intelligence">
            <div className="intel-grid">
              <span>
                <small>Industry</small>

                <b>
                  {company.industry || "—"}
                </b>
              </span>

              <span>
                <small>Location</small>

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
                <small>Data Confidence</small>

                <b>
                  {company.data_confidence ??
                    scoreData?.confidence_score ??
                    0}
                  %
                </b>
              </span>

              <span>
                <small>Status</small>

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
                <small>Source</small>

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