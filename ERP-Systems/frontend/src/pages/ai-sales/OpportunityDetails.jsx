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

export default function OpportunityDetails({
  onNavigate,
  activeView = "ai-sales-opportunity-detail",
}) {
  const [opportunity, setOpportunity] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [editForm, setEditForm] =
    useState({
      stage: "new",
      probability: 0,
      value: "",
      expected_close_date: "",
      next_best_action: "",
    });

  /*
  |--------------------------------------------------------------------------
  | Selected Opportunity
  |--------------------------------------------------------------------------
  */

  function getStoredOpportunity() {
    try {
      const raw =
        sessionStorage.getItem(
          "ai-sales-selected-opportunity"
        );

      return raw
        ? JSON.parse(raw)
        : null;
    } catch {
      return null;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Normalize Opportunity
  |--------------------------------------------------------------------------
  */

  function applyOpportunity(data) {
    if (!data) {
      return;
    }

    setOpportunity(data);

    setEditForm({
      stage:
        data.stage || "new",

      probability:
        data.probability ?? 0,

      value:
        data.value ??
        "",

      expected_close_date:
        data.expected_close_date
          ? String(
              data.expected_close_date
            ).slice(0, 10)
          : "",

      next_best_action:
        data.next_best_action ??
        "",
    });

    sessionStorage.setItem(
      "ai-sales-selected-opportunity",
      JSON.stringify(data)
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Load Opportunity
  |--------------------------------------------------------------------------
  */

  async function loadOpportunity() {
    setLoading(true);
    setError("");
    setSuccess("");

    const stored =
      getStoredOpportunity();

    if (!stored?.id) {
      setLoading(false);

      setError(
        "No opportunity selected. Open an opportunity from the pipeline or a lead."
      );

      return;
    }

    try {
      const data =
        await aiSalesRequest(
          `/opportunities/${stored.id}`
        );

      const result =
        data?.opportunity ??
        data?.data ??
        data;

      applyOpportunity(result);
    } catch (err) {
      console.error(
        "Failed to load opportunity:",
        err
      );

      /*
       * Keep the selected opportunity visible
       * if the detail request fails.
       */
      applyOpportunity(stored);

      setError(
        err.message ||
          "Unable to load opportunity details."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunity();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Relations
  |--------------------------------------------------------------------------
  */

  const company =
    opportunity?.company ??
    opportunity?.lead?.company ??
    null;

  const lead =
    opportunity?.lead ??
    null;

  /*
  |--------------------------------------------------------------------------
  | AI Score
  |--------------------------------------------------------------------------
  */

  const scoreData =
    useMemo(() => {
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

  const overallScore =
    Number(
      scoreData?.overall_score ??
        scoreData?.overall ??
        lead?.qualification_score ??
        0
    );

  const confidence =
    Number(
      scoreData?.confidence_score ??
        scoreData?.confidence ??
        company?.data_confidence ??
        0
    );

  /*
  |--------------------------------------------------------------------------
  | Signals
  |--------------------------------------------------------------------------
  */

  const signals =
    useMemo(() => {
      if (
        Array.isArray(
          company?.signals
        )
      ) {
        return company.signals;
      }

      if (
        Array.isArray(
          company?.active_signals
        )
      ) {
        return company.active_signals;
      }

      return [];
    }, [company]);

  /*
  |--------------------------------------------------------------------------
  | Matched Items
  |--------------------------------------------------------------------------
  */

  const matchedItems =
    useMemo(() => {
      if (
        Array.isArray(
          opportunity?.matched_items
        )
      ) {
        return opportunity.matched_items;
      }

      if (
        Array.isArray(
          company?.catalog_matches
        )
      ) {
        return company.catalog_matches;
      }

      const enrichment =
        company?.enrichment ?? {};

      if (
        Array.isArray(
          enrichment.matched_targets
        )
      ) {
        return enrichment.matched_targets;
      }

      return [];
    }, [
      opportunity,
      company,
    ]);

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

    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-SA",
      {
        style: "currency",
        currency:
          currency || "SAR",
        maximumFractionDigits: 0,
      }
    ).format(number);
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

    return date.toLocaleDateString(
      "en-GB"
    );
  }

  function capitalize(value) {
    if (!value) {
      return "—";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  }

  function signalTitle(signal) {
    if (
      typeof signal ===
      "string"
    ) {
      return signal;
    }

    return (
      signal.title ??
      signal.name ??
      signal.type ??
      "Buying Signal"
    );
  }

  function itemTitle(item) {
    if (
      typeof item ===
      "string"
    ) {
      return item;
    }

    if (
      typeof item ===
      "number"
    ) {
      return `Catalog #${item}`;
    }

    return (
      item?.name ??
      item?.title ??
      item?.product_name ??
      item?.service_name ??
      "Catalog Match"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Weighted Pipeline Value
  |--------------------------------------------------------------------------
  */

  const weightedValue =
    useMemo(() => {
      const value =
        Number(
          opportunity?.value ??
            0
        );

      const probability =
        Number(
          opportunity?.probability ??
            0
        );

      if (
        !Number.isFinite(value) ||
        !Number.isFinite(
          probability
        )
      ) {
        return 0;
      }

      return (
        value *
        (probability / 100)
      );
    }, [opportunity]);

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
  | Open Lead
  |--------------------------------------------------------------------------
  */

  function openLead() {
    if (!lead?.id) {
      return;
    }

    sessionStorage.setItem(
      "ai-sales-selected-lead",
      JSON.stringify(lead)
    );

    onNavigate?.(
      "ai-sales-lead-detail"
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

    if (opportunity) {
      sessionStorage.setItem(
        "ai-sales-selected-opportunity",
        JSON.stringify(
          opportunity
        )
      );
    }

    onNavigate?.(
      "ai-sales-message"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Update Opportunity
  |--------------------------------------------------------------------------
  */

  async function saveOpportunity() {
    if (
      !opportunity?.id ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const probability =
        Number(
          editForm.probability
        );

      if (
        !Number.isFinite(
          probability
        ) ||
        probability < 0 ||
        probability > 100
      ) {
        throw new Error(
          "Probability must be between 0 and 100."
        );
      }

      let value = null;

      if (
        editForm.value !== ""
      ) {
        value =
          Number(
            editForm.value
          );

        if (
          !Number.isFinite(value) ||
          value < 0
        ) {
          throw new Error(
            "Opportunity value must be a valid positive number."
          );
        }
      }

      const payload = {
        stage:
          editForm.stage,

        probability,

        value,

        expected_close_date:
          editForm.expected_close_date ||
          null,

        next_best_action:
          editForm.next_best_action ||
          null,
      };

      const data =
        await aiSalesRequest(
          `/opportunities/${opportunity.id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              payload
            ),
          }
        );

      const updated =
        data?.opportunity ??
        data?.data ??
        data;

      applyOpportunity(
        updated
      );

      setSuccess(
        "Opportunity updated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to update opportunity:",
        err
      );

      setError(
        err.message ||
          "Unable to update opportunity."
      );
    } finally {
      setSaving(false);
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
        title="مساحة عمل الفرصة"
        subtitle="جارٍ تحميل الذكاء التجاري وبيانات الصفقة..."
      >
        <div
          style={{
            padding: 50,
            textAlign: "center",
            opacity: 0.65,
          }}
        >
          Loading Opportunity...
        </div>
      </Shell>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Missing Opportunity
  |--------------------------------------------------------------------------
  */

  if (!opportunity) {
    return (
      <Shell
        activeView={activeView}
        onNavigate={onNavigate}
        title="مساحة عمل الفرصة"
        subtitle="الذكاء التجاري وأصحاب المصلحة والمهام وصحة الصفقة."
      >
        <Panel title="فرصة">
          <div
            style={{
              padding: 35,
              textAlign: "center",
            }}
          >
            <p>
              {error ||
                "No opportunity selected."}
            </p>

            <Btn
              onClick={() =>
                onNavigate?.(
                  "ai-sales-opportunities"
                )
              }
            >
              Open Pipeline
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
      title="مساحة عمل الفرصة"
      subtitle="Commercial intelligence, qualification, pipeline health and next best action."
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
            }}
          >
            {success}
          </div>
        )}

        {/* Hero */}

        <div className="account-hero">
          <div className="account-logo">
            <uiIcons.Handshake
              size={30}
            />
          </div>

          <div>
            <small>
              SALES OPPORTUNITY
            </small>

            <h2>
              {opportunity.title ||
                `Opportunity #${opportunity.id}`}
            </h2>

            <p>
              <uiIcons.Building2
                size={14}
              />

              {" "}

              {company?.name ||
                "شركة غير معروفة"}

              {company?.city
                ? ` • ${company.city}`
                : ""}

              {company?.industry
                ? ` • ${company.industry}`
                : ""}
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
            onClick={
              openCompany
            }
            disabled={
              !company?.id
            }
          >
            View Company
          </Btn>
        </div>

        {/* KPIs */}

        <div className="mini-kpis">
          <Kpi
            type="opportunities"
            title="قيمة الصفقة"
            value={formatMoney(
              opportunity.value,
              opportunity.currency
            )}
            delta=""
            note="القيمة التقديرية للفرصة"
          />

          <Kpi
            type="rate"
            title="الاحتمالية"
            value={`${
              opportunity.probability ??
              0
            }%`}
            delta=""
            note="احتمالية الفوز"
          />

          <Kpi
            type="companies"
            title="القيمة المرجحة"
            value={formatMoney(
              weightedValue,
              opportunity.currency
            )}
            delta=""
            note="القيمة × الاحتمالية"
          />

          <Kpi
            type="leads"
            title="المرحلة"
            value={capitalize(
              opportunity.stage
            )}
            delta=""
            note="مرحلة مسار المبيعات"
          />
        </div>

        {/* Main Intelligence */}

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
                        index
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

          <Panel title="المنتجات والخدمات المطابقة">
            {matchedItems.length ? (
              <>
                <div className="service-pills">
                  {matchedItems.map(
                    (
                      item,
                      index
                    ) => (
                      <span
                        key={
                          item?.id ??
                          index
                        }
                      >
                        {itemTitle(
                          item
                        )}
                      </span>
                    )
                  )}
                </div>

                <p>
                  Matches are based on
                  available ERP catalog
                  and account
                  intelligence.
                </p>
              </>
            ) : (
              <p>
                No matched catalog
                items available yet.
              </p>
            )}
          </Panel>

          <Panel title="أفضل إجراء تالٍ">
            <h2>
              {opportunity.next_best_action ||
                (overallScore >= 80
                  ? "Prioritize this deal"
                  : overallScore >= 60
                    ? "Qualify commercial requirements"
                    : "Continue opportunity research")}
            </h2>

            <p>
              {overallScore >= 80
                ? "The account has strong fit. Confirm stakeholders, requirements and buying timeline."
                : overallScore >= 60
                  ? "Validate scope, budget, decision makers and expected purchasing window."
                  : "Gather stronger intent, stakeholder and timing signals before accelerating the deal."}
            </p>

            <Btn
              onClick={
                prepareOutreach
              }
            >
              Prepare Outreach
            </Btn>
          </Panel>
        </div>

        {/* Deal Management */}

        <div className="workspace-2">
          <Panel title="إدارة الصفقة">
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              <label>
                <small>
                  Pipeline Stage
                </small>

                <select
                  value={
                    editForm.stage
                  }
                  onChange={(e) =>
                    setEditForm(
                      (current) => ({
                        ...current,
                        stage:
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
                  <option value="new">
                    New
                  </option>

                  <option value="qualified">
                    Qualified
                  </option>

                  <option value="proposal">
                    Proposal
                  </option>

                  <option value="negotiation">
                    Negotiation
                  </option>

                  <option value="won">
                    Won
                  </option>

                  <option value="lost">
                    Lost
                  </option>
                </select>
              </label>

              <label>
                <small>
                  Probability
                </small>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    editForm.probability
                  }
                  onChange={(e) =>
                    setEditForm(
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
                />
              </label>

              <label>
                <small>
                  Deal Value
                </small>

                <input
                  type="number"
                  min="0"
                  value={
                    editForm.value
                  }
                  onChange={(e) =>
                    setEditForm(
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
                  Expected Close Date
                </small>

                <input
                  type="date"
                  value={
                    editForm.expected_close_date
                  }
                  onChange={(e) =>
                    setEditForm(
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

            <label
              style={{
                display: "block",
                marginTop: 14,
              }}
            >
              <small>
                Next Best Action
              </small>

              <textarea
                rows={3}
                value={
                  editForm.next_best_action
                }
                placeholder="Add the recommended next commercial action..."
                onChange={(e) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      next_best_action:
                        e.target.value,
                    })
                  )
                }
                style={{
                  width: "100%",
                  marginTop: 6,
                  resize: "vertical",
                }}
              />
            </label>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 8,
              }}
            >
              <Btn
                onClick={
                  saveOpportunity
                }
                disabled={saving}
              >
                {saving
                  ? "جارٍ الحفظ..."
                  : "حفظ الفرصة"}
              </Btn>

              {lead?.id && (
                <Btn
                  secondary
                  onClick={
                    openLead
                  }
                >
                  View Lead
                </Btn>
              )}
            </div>
          </Panel>

          {/* Commercial Intelligence */}

          <Panel title="الذكاء التجاري">
            <div className="intel-grid">
              <span>
                <small>
                  Company
                </small>

                <b>
                  {company?.name ||
                    "—"}
                </b>
              </span>

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
                  Opportunity Value
                </small>

                <b>
                  {formatMoney(
                    opportunity.value,
                    opportunity.currency
                  )}
                </b>
              </span>

              <span>
                <small>
                  Weighted Value
                </small>

                <b>
                  {formatMoney(
                    weightedValue,
                    opportunity.currency
                  )}
                </b>
              </span>

              <span>
                <small>
                  Expected Close
                </small>

                <b>
                  {formatDate(
                    opportunity.expected_close_date
                  )}
                </b>
              </span>

              <span>
                <small>
                  Data Confidence
                </small>

                <b>
                  {confidence}%
                </b>
              </span>

              <span>
                <small>
                  Opportunity ID
                </small>

                <b>
                  #{opportunity.id}
                </b>
              </span>

              <span>
                <small>
                  Lead ID
                </small>

                <b>
                  {lead?.id
                    ? `#${lead.id}`
                    : "—"}
                </b>
              </span>
            </div>
          </Panel>
        </div>
      </>
    </Shell>
  );
}