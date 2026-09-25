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

export default function LeadDetails({
  onNavigate,
  activeView = "ai-sales-lead-detail",
}) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creatingOpportunity, setCreatingOpportunity] =
    useState(false);

  const [showOpportunityForm, setShowOpportunityForm] =
    useState(false);

  const [opportunityForm, setOpportunityForm] = useState({
    title: "",
    value: "",
    probability: 20,
    expected_close_date: "",
  });

  /*
  |--------------------------------------------------------------------------
  | Selected Lead
  |--------------------------------------------------------------------------
  */

  function getStoredLead() {
    try {
      const raw = sessionStorage.getItem(
        "ai-sales-selected-lead"
      );

      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load Lead
  |--------------------------------------------------------------------------
  */

  async function loadLead() {
    setLoading(true);
    setError("");

    const stored = getStoredLead();

    if (!stored?.id) {
      setLoading(false);

      setError(
        "No lead selected. Open a lead from Company 360 or Lead Management."
      );

      return;
    }

    try {
      const data = await aiSalesRequest(
        `/leads/${stored.id}`
      );

      const result =
        data?.lead ??
        data?.data ??
        data;

      setLead(result);

      sessionStorage.setItem(
        "ai-sales-selected-lead",
        JSON.stringify(result)
      );
    } catch (err) {
      console.error(
        "Failed to load Lead Details:",
        err
      );

      setLead(stored);

      setError(
        err.message ||
          "Unable to load full lead intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLead();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Company
  |--------------------------------------------------------------------------
  */

  const company =
    lead?.company ?? null;

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
      lead?.qualification_score ??
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
      Array.isArray(
        company.active_signals
      )
    ) {
      return company.active_signals;
    }

    return [];
  }, [company]);

  /*
  |--------------------------------------------------------------------------
  | Opportunities
  |--------------------------------------------------------------------------
  */

  const opportunities = useMemo(() => {
    if (
      Array.isArray(
        lead?.opportunities
      )
    ) {
      return lead.opportunities;
    }

    return [];
  }, [lead]);

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
      Array.isArray(
        company.catalog_matches
      )
    ) {
      return company.catalog_matches;
    }

    if (
      Array.isArray(
        company.service_matches
      )
    ) {
      return company.service_matches;
    }

    const enrichment =
      company.enrichment ?? {};

    if (
      Array.isArray(
        enrichment.matched_targets
      )
    ) {
      return enrichment.matched_targets;
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

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString();
  }

  function formatMoney(value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    const amount =
      Number(value);

    if (
      !Number.isFinite(amount)
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-SA",
      {
        style: "currency",
        currency: "SAR",
        maximumFractionDigits: 0,
      }
    ).format(amount);
  }

  /*
  |--------------------------------------------------------------------------
  | Open Company
  |--------------------------------------------------------------------------
  */

  function openCompany() {
    if (!company?.id) {
      return;
    }

    sessionStorage.setItem(
      "ai-sales-selected-company",
      JSON.stringify(company)
    );

    onNavigate?.(
      "ai-sales-company"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Prepare Outreach
  |--------------------------------------------------------------------------
  */

  function prepareOutreach() {
    if (company) {
      sessionStorage.setItem(
        "ai-sales-selected-company",
        JSON.stringify(company)
      );
    }

    if (lead) {
      sessionStorage.setItem(
        "ai-sales-selected-lead",
        JSON.stringify(lead)
      );
    }

    onNavigate?.(
      "ai-sales-message"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Create Opportunity
  |--------------------------------------------------------------------------
  */

  async function createOpportunity() {
    if (
      !lead?.id ||
      !company?.id ||
      creatingOpportunity
    ) {
      return;
    }

    const title =
      opportunityForm.title.trim();

    if (!title) {
      setError(
        "Opportunity title is required."
      );

      return;
    }

    const numericValue =
      opportunityForm.value === ""
        ? null
        : Number(
            opportunityForm.value
          );

    if (
      numericValue !== null &&
      (
        !Number.isFinite(
          numericValue
        ) ||
        numericValue < 0
      )
    ) {
      setError(
        "Opportunity value must be a valid positive number."
      );

      return;
    }

    const probability =
      Number(
        opportunityForm.probability
      );

    if (
      !Number.isFinite(
        probability
      ) ||
      probability < 0 ||
      probability > 100
    ) {
      setError(
        "Probability must be between 0 and 100."
      );

      return;
    }

    setCreatingOpportunity(true);
    setError("");

    try {
      const payload = {
        company_id: company.id,
        lead_id: lead.id,
        title,
        stage: "new",
        currency: "SAR",
        probability,
      };

      if (numericValue !== null) {
        payload.value =
          numericValue;
      }

      if (
        opportunityForm
          .expected_close_date
      ) {
        payload.expected_close_date =
          opportunityForm
            .expected_close_date;
      }

      const data =
        await aiSalesRequest(
          "/opportunities",
          {
            method: "POST",
            body: JSON.stringify(
              payload
            ),
          }
        );

      const opportunity =
        data?.opportunity ??
        data?.data ??
        data;

      if (!opportunity?.id) {
        throw new Error(
          "Opportunity was created but the API did not return a valid record."
        );
      }

      sessionStorage.setItem(
        "ai-sales-selected-opportunity",
        JSON.stringify(
          opportunity
        )
      );

      setLead((current) => {
        const currentOpportunities =
          Array.isArray(
            current?.opportunities
          )
            ? current.opportunities
            : [];

        return {
          ...current,

          opportunities: [
            ...currentOpportunities,
            opportunity,
          ],
        };
      });

      setShowOpportunityForm(
        false
      );

      setOpportunityForm({
        title: "",
        value: "",
        probability: 20,
        expected_close_date: "",
      });
    } catch (err) {
      console.error(
        "Failed to create opportunity:",
        err
      );

      setError(
        err.message ||
          "Unable to create opportunity."
      );
    } finally {
      setCreatingOpportunity(
        false
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Open Opportunity
  |--------------------------------------------------------------------------
  */

  function openOpportunity(
    opportunity
  ) {
    if (!opportunity?.id) {
      return;
    }

    sessionStorage.setItem(
      "ai-sales-selected-opportunity",
      JSON.stringify(
        opportunity
      )
    );

    onNavigate?.(
      "ai-sales-opportunity-detail"
    );
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
        title="ذكاء العملاء المحتملين"
        subtitle="Loading qualification and account intelligence..."
      >
        <div
          style={{
            padding: 40,
            textAlign: "center",
            opacity: 0.65,
          }}
        >
          Loading Lead Intelligence...
        </div>
      </Shell>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | No Lead
  |--------------------------------------------------------------------------
  */

  if (!lead) {
    return (
      <Shell
        activeView={activeView}
        onNavigate={onNavigate}
        title="ذكاء العملاء المحتملين"
        subtitle="Qualification, contacts, activity, signals and next best action in one view."
      >
        <Panel title="عميل محتمل">
          <div
            style={{
              padding: 30,
              textAlign: "center",
            }}
          >
            {error && (
              <p
                style={{
                  color: "#b91c1c",
                }}
              >
                {error}
              </p>
            )}

            <strong>
              No lead selected.
            </strong>

            <p>
              Open a lead from Company
              360 or Lead Management.
            </p>

            <Btn
              onClick={() =>
                onNavigate?.(
                  "ai-sales-leads"
                )
              }
            >
              Go to Leads
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
      title="ذكاء العملاء المحتملين"
      subtitle="Qualification, contacts, activity, signals and next best action in one view."
    >
      <>
        {/* Error */}

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
            }}
          >
            {error}
          </div>
        )}

        {/* Lead Hero */}

        <div className="account-hero">
          <div className="account-logo">
            <uiIcons.Building2
              size={30}
            />
          </div>

          <div>
            <small>
              SALES LEAD
            </small>

            <h2>
              {company?.name ||
                "شركة بدون اسم"}
            </h2>

            <p>
              <uiIcons.MapPin
                size={14}
              />

              {" "}

              {[
                company?.city,
                company?.region,
                company?.industry,
              ]
                .filter(Boolean)
                .join(" • ") ||
                "—"}
            </p>
          </div>

          <div className="account-score">
            <span>
              AI Fit Score
            </span>

            <Score
              n={overallScore}
            />
          </div>

          <Btn
            secondary
            onClick={openCompany}
          >
            View Company
          </Btn>
        </div>

        {/* Lead KPIs */}

        <div className="mini-kpis">
          <Kpi
            type="leads"
            title="الأولوية"
            value={
              lead.priority
                ? lead.priority
                    .charAt(0)
                    .toUpperCase() +
                  lead.priority.slice(1)
                : "—"
            }
            delta=""
            note="Sales priority"
          />

          <Kpi
            type="companies"
            title="الحالة"
            value={
              lead.status
                ? lead.status
                    .charAt(0)
                    .toUpperCase() +
                  lead.status.slice(1)
                : "جديد"
            }
            delta=""
            note="Lead status"
          />

          <Kpi
            type="opportunities"
            title="الفرص"
            value={
              opportunities.length
            }
            delta=""
            note="Linked opportunities"
          />

          <Kpi
            type="rate"
            title="الثقة"
            value={
              scoreData
                ?.confidence_score ??
              scoreData
                ?.confidence ??
              company
                ?.data_confidence ??
              0
            }
            delta=""
            note="موثوقية البيانات"
          />
        </div>

        {/* Intelligence */}

        <div className="workspace-3">
          <Panel title="إشارات الحساب">
            {signals.length ? (
              <div className="signal-list">
                {signals.map(
                  (
                    signal,
                    index
                  ) => (
                    <b
                      key={
                        signal?.id ??
                        `${signalTitle(
                          signal
                        )}-${index}`
                      }
                    >
                      {signalTitle(
                        signal
                      )}
                    </b>
                  )
                )}
              </div>
            ) : (
              <p>
                No verified buying
                signals detected yet.
              </p>
            )}
          </Panel>

          <Panel title="المنتجات والخدمات المقترحة">
            {catalogMatches.length ? (
              <>
                <div className="service-pills">
                  {catalogMatches.map(
                    (
                      match,
                      index
                    ) => (
                      <span
                        key={
                          match?.id ??
                          `${matchTitle(
                            match
                          )}-${index}`
                        }
                      >
                        {matchTitle(
                          match
                        )}
                      </span>
                    )
                  )}
                </div>

                <p>
                  Recommendations are
                  based on ERP catalog
                  matching and available
                  company intelligence.
                </p>
              </>
            ) : (
              <p>
                No catalog
                recommendations
                available yet.
              </p>
            )}
          </Panel>

          <Panel title="أفضل إجراء تالٍ">
            {overallScore >= 85 ? (
              <>
                <h2>
                  Prioritize outreach
                </h2>

                <p>
                  This lead has a high
                  AI score and should be
                  reviewed for immediate
                  sales engagement.
                </p>
              </>
            ) : overallScore >= 60 ? (
              <>
                <h2>
                  Qualify the lead
                </h2>

                <p>
                  Confirm the buying
                  requirement and identify
                  relevant stakeholders.
                </p>
              </>
            ) : (
              <>
                <h2>
                  Continue research
                </h2>

                <p>
                  Gather additional intent
                  and timing signals before
                  prioritizing outreach.
                </p>
              </>
            )}

            <Btn
              onClick={
                prepareOutreach
              }
            >
              Prepare Outreach
            </Btn>
          </Panel>
        </div>

        {/* Contact + Qualification */}

        <div className="workspace-2">
          <Panel title="جهة اتصال العميل">
            <div className="intel-grid">
              <span>
                <small>
                  Contact Name
                </small>

                <b>
                  {lead.contact_name ||
                    "غير محدد"}
                </b>
              </span>

              <span>
                <small>
                  Job Title
                </small>

                <b>
                  {lead.contact_title ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Email
                </small>

                <b>
                  {lead.email || "—"}
                </b>
              </span>

              <span>
                <small>
                  Phone
                </small>

                <b>
                  {lead.phone || "—"}
                </b>
              </span>
            </div>
          </Panel>

          <Panel title="التأهيل">
            <div className="intel-grid">
              <span>
                <small>
                  Qualification Score
                </small>

                <b>
                  {lead.qualification_score ??
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Priority
                </small>

                <b
                  style={{
                    textTransform:
                      "capitalize",
                  }}
                >
                  {lead.priority ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Status
                </small>

                <b
                  style={{
                    textTransform:
                      "capitalize",
                  }}
                >
                  {lead.status ||
                    "new"}
                </b>
              </span>

              <span>
                <small>
                  Created
                </small>

                <b>
                  {formatDate(
                    lead.created_at
                  )}
                </b>
              </span>
            </div>

            {lead.notes && (
              <div
                style={{
                  marginTop: 16,
                  padding: 14,
                  background:
                    "#faf9ff",
                  border:
                    "1px solid #ebe8ff",
                  borderRadius: 10,
                }}
              >
                <small>
                  NOTES
                </small>

                <p
                  style={{
                    marginBottom: 0,
                  }}
                >
                  {lead.notes}
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* Opportunities */}

        <div className="workspace-2">
          <Panel
            title="الفرص المرتبطة"
            action={
              <button
                type="button"
                onClick={() =>
                  setShowOpportunityForm(
                    (current) =>
                      !current
                  )
                }
                style={{
                  border: 0,
                  background:
                    "transparent",
                  color: "#6657F5",
                  cursor: "pointer",
                  fontWeight: 800,
                }}
              >
                {showOpportunityForm
                  ? "إلغاء"
                  : "+ إنشاء فرصة"}
              </button>
            }
          >
            {showOpportunityForm && (
              <div
                style={{
                  marginBottom: 18,
                  padding: 16,
                  border:
                    "1px solid #ebe8ff",
                  background:
                    "#faf9ff",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: 12,
                  }}
                >
                  <label>
                    <small>
                      Opportunity Title *
                    </small>

                    <input
                      type="text"
                      value={
                        opportunityForm.title
                      }
                      placeholder="e.g. Summit Logistics Expansion"
                      onChange={(e) =>
                        setOpportunityForm(
                          (current) => ({
                            ...current,
                            title:
                              e.target
                                .value,
                          })
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop: 6,
                      }}
                    />
                  </label>

                  <label>
                    <small>
                      Estimated Value
                      (SAR)
                    </small>

                    <input
                      type="number"
                      min="0"
                      value={
                        opportunityForm.value
                      }
                      placeholder="250000"
                      onChange={(e) =>
                        setOpportunityForm(
                          (current) => ({
                            ...current,
                            value:
                              e.target
                                .value,
                          })
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop: 6,
                      }}
                    />
                  </label>

                  <label>
                    <small>
                      Probability
                    </small>

                    <select
                      value={
                        opportunityForm
                          .probability
                      }
                      onChange={(e) =>
                        setOpportunityForm(
                          (current) => ({
                            ...current,
                            probability:
                              e.target
                                .value,
                          })
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop: 6,
                      }}
                    >
                      <option value="10">
                        10%
                      </option>
                      <option value="20">
                        20%
                      </option>
                      <option value="30">
                        30%
                      </option>
                      <option value="40">
                        40%
                      </option>
                      <option value="50">
                        50%
                      </option>
                      <option value="60">
                        60%
                      </option>
                      <option value="70">
                        70%
                      </option>
                      <option value="80">
                        80%
                      </option>
                      <option value="90">
                        90%
                      </option>
                      <option value="100">
                        100%
                      </option>
                    </select>
                  </label>

                  <label>
                    <small>
                      Expected Close Date
                    </small>

                    <input
                      type="date"
                      value={
                        opportunityForm
                          .expected_close_date
                      }
                      onChange={(e) =>
                        setOpportunityForm(
                          (current) => ({
                            ...current,
                            expected_close_date:
                              e.target
                                .value,
                          })
                        )
                      }
                      style={{
                        width: "100%",
                        marginTop: 6,
                      }}
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
                      setShowOpportunityForm(
                        false
                      )
                    }
                  >
                    Cancel
                  </Btn>

                  <Btn
                    onClick={
                      createOpportunity
                    }
                    disabled={
                      creatingOpportunity
                    }
                  >
                    {creatingOpportunity
                      ? "جارٍ الإنشاء..."
                      : "إنشاء فرصة"}
                  </Btn>
                </div>
              </div>
            )}

            {opportunities.length ? (
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {opportunities.map(
                  (opportunity) => (
                    <button
                      type="button"
                      key={
                        opportunity.id
                      }
                      onClick={() =>
                        openOpportunity(
                          opportunity
                        )
                      }
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border:
                          "1px solid #e5e7eb",
                        background:
                          "#fff",
                        borderRadius: 10,
                        padding: 14,
                        cursor:
                          "pointer",
                      }}
                    >
                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap: 12,
                          alignItems:
                            "center",
                        }}
                      >
                        <strong>
                          {opportunity.title ??
                            opportunity.name ??
                            `Opportunity #${opportunity.id}`}
                        </strong>

                        <span
                          style={{
                            padding:
                              "4px 8px",
                            borderRadius:
                              999,
                            background:
                              "#f1efff",
                            color:
                              "#6657F5",
                            fontSize: 12,
                            fontWeight:
                              700,
                            textTransform:
                              "capitalize",
                          }}
                        >
                          {opportunity.stage ||
                            "new"}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: 8,
                          opacity: 0.7,
                        }}
                      >
                        {formatMoney(
                          opportunity.value ??
                            opportunity
                              .estimated_value
                        )}

                        {" • "}

                        {opportunity.probability ??
                          0}
                        % probability

                        {opportunity.expected_close_date
                          ? ` • ${formatDate(
                              opportunity.expected_close_date
                            )}`
                          : ""}
                      </div>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div>
                <p>
                  No opportunity has been
                  created for this lead
                  yet.
                </p>

                {!showOpportunityForm && (
                  <Btn
                    onClick={() =>
                      setShowOpportunityForm(
                        true
                      )
                    }
                  >
                    Create First
                    Opportunity
                  </Btn>
                )}
              </div>
            )}
          </Panel>

          {/* Account Intelligence */}

          <Panel title="ذكاء الحساب">
            <div className="intel-grid">
              <span>
                <small>
                  Industry
                </small>

                <b>
                  {company?.industry ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Location
                </small>

                <b>
                  {[
                    company?.city,
                    company?.region,
                    company?.country,
                  ]
                    .filter(Boolean)
                    .join(", ") ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Website
                </small>

                <b>
                  {company?.website ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Company Status
                </small>

                <b
                  style={{
                    textTransform:
                      "capitalize",
                  }}
                >
                  {company?.status ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Source
                </small>

                <b>
                  {company?.source ||
                    company
                      ?.enrichment
                      ?.provider ||
                    "—"}
                </b>
              </span>

              <span>
                <small>
                  Lead ID
                </small>

                <b>
                  #{lead.id}
                </b>
              </span>
            </div>
          </Panel>
        </div>
      </>
    </Shell>
  );
}