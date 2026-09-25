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

const STAGES = [
  {
    id: "new",
    label: "جديد",
  },
  {
    id: "qualified",
    label: "مؤهل",
  },
  {
    id: "proposal",
    label: "عرض",
  },
  {
    id: "negotiation",
    label: "تفاوض",
  },
  {
    id: "won",
    label: "فائز",
  },
  {
    id: "lost",
    label: "خاسر",
  },
];

export default function Opportunities({
  onNavigate,
  activeView = "ai-sales-opportunities",
}) {
  const [opportunities, setOpportunities] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Opportunities
  |--------------------------------------------------------------------------
  */

  async function loadOpportunities() {
    setLoading(true);
    setError("");

    try {
      const data =
        await aiSalesRequest(
          "/opportunities?per_page=100"
        );

      const items =
        Array.isArray(data)
          ? data
          : data?.data || [];

      setOpportunities(items);
    } catch (err) {
      console.error(
        "Failed to load AI Sales opportunities:",
        err
      );

      setError(
        err.message ||
          "Unable to load opportunities."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpportunities();
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
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return "SAR 0";
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
      return "No close date";
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

  function getCompany(
    opportunity
  ) {
    return (
      opportunity?.company ??
      opportunity?.lead?.company ??
      null
    );
  }

  function getScore(
    opportunity
  ) {
    const company =
      getCompany(opportunity);

    return Number(
      company?.latest_score
        ?.overall_score ??
        company?.latest_score
          ?.overall ??
        opportunity?.lead
          ?.qualification_score ??
        0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Filter
  |--------------------------------------------------------------------------
  */

  const filteredOpportunities =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return opportunities;
      }

      return opportunities.filter(
        (opportunity) => {
          const company =
            getCompany(
              opportunity
            );

          return [
            opportunity.title,
            opportunity.stage,
            company?.name,
            company?.industry,
            company?.city,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            );
        }
      );
    }, [
      opportunities,
      search,
    ]);

  /*
  |--------------------------------------------------------------------------
  | Pipeline Groups
  |--------------------------------------------------------------------------
  */

  const pipeline =
    useMemo(() => {
      const groups = {};

      STAGES.forEach(
        (stage) => {
          groups[stage.id] = [];
        }
      );

      filteredOpportunities.forEach(
        (opportunity) => {
          const stage =
            opportunity.stage ||
            "new";

          if (!groups[stage]) {
            groups[stage] = [];
          }

          groups[stage].push(
            opportunity
          );
        }
      );

      return groups;
    }, [
      filteredOpportunities,
    ]);

  /*
  |--------------------------------------------------------------------------
  | KPIs
  |--------------------------------------------------------------------------
  */

  const stats =
    useMemo(() => {
      let totalPipeline = 0;
      let weightedPipeline = 0;
      let wonValue = 0;
      let openDeals = 0;

      opportunities.forEach(
        (opportunity) => {
          const value =
            Number(
              opportunity.value ??
                0
            );

          const probability =
            Number(
              opportunity.probability ??
                0
            );

          if (
            Number.isFinite(value)
          ) {
            totalPipeline += value;

            if (
              opportunity.stage ===
              "won"
            ) {
              wonValue += value;
            }
          }

          if (
            Number.isFinite(value) &&
            Number.isFinite(
              probability
            )
          ) {
            weightedPipeline +=
              value *
              (probability /
                100);
          }

          if (
            ![
              "won",
              "lost",
            ].includes(
              opportunity.stage
            )
          ) {
            openDeals += 1;
          }
        }
      );

      return {
        totalPipeline,
        weightedPipeline,
        wonValue,
        openDeals,
      };
    }, [opportunities]);

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
  | Open Lead
  |--------------------------------------------------------------------------
  */

  function openLead(
    event,
    opportunity
  ) {
    event.stopPropagation();

    const lead =
      opportunity?.lead;

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
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="مسار الفرص"
      subtitle="تابع الصفقات المؤهلة من الاكتشاف حتى التأهيل والعرض والتفاوض والإغلاق."
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

        {/* KPIs */}

        <div className="mini-kpis">
          <Kpi
            type="opportunities"
            title="إجمالي المسار"
            value={formatMoney(
              stats.totalPipeline
            )}
            delta=""
            note={`${opportunities.length} opportunities`}
          />

          <Kpi
            type="rate"
            title="المسار المرجح"
            value={formatMoney(
              stats.weightedPipeline
            )}
            delta=""
            note="معدّل حسب الاحتمالية"
          />

          <Kpi
            type="companies"
            title="الصفقات المفتوحة"
            value={
              stats.openDeals
            }
            delta=""
            note="الفرص النشطة"
          />

          <Kpi
            type="leads"
            title="قيمة الصفقات الفائزة"
            value={formatMoney(
              stats.wonValue
            )}
            delta=""
            note="إيرادات الصفقات المغلقة بنجاح"
          />
        </div>

        {/* Pipeline */}

        <Panel
          title="مسار المبيعات"
          action={
            <button
              type="button"
              onClick={
                loadOpportunities
              }
              disabled={loading}
              style={{
                border: 0,
                background:
                  "transparent",
                color: "#6657F5",
                fontWeight: 800,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "جارٍ التحميل..."
                : "تحديث"}
            </button>
          }
        >
          {/* Search */}

          <div
            style={{
              position:
                "relative",
              marginBottom: 18,
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
              placeholder="ابحث عن فرصة أو شركة أو قطاع أو موقع..."
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

          {/* Loading */}

          {loading ? (
            <div
              style={{
                padding: 50,
                textAlign:
                  "center",
                opacity: 0.65,
              }}
            >
              Loading AI Sales
              pipeline...
            </div>
          ) : !opportunities
              .length ? (
            /* Empty */

            <div
              style={{
                padding: 50,
                textAlign:
                  "center",
              }}
            >
              <uiIcons.Handshake
                size={36}
                style={{
                  opacity: 0.35,
                }}
              />

              <h3>
                No opportunities
                yet
              </h3>

              <p>
                Convert a discovered
                company into a lead,
                then create its first
                opportunity.
              </p>

              <Btn
                onClick={() =>
                  onNavigate?.(
                    "ai-sales-leads"
                  )
                }
              >
                Open Leads
              </Btn>
            </div>
          ) : (
            /* Kanban */

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  `repeat(${STAGES.length}, minmax(235px, 1fr))`,
                gap: 12,
                overflowX:
                  "auto",
                paddingBottom: 8,
              }}
            >
              {STAGES.map(
                (stage) => {
                  const stageItems =
                    pipeline[
                      stage.id
                    ] || [];

                  const stageValue =
                    stageItems.reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        (Number(
                          item.value
                        ) || 0),
                      0
                    );

                  return (
                    <div
                      key={
                        stage.id
                      }
                      style={{
                        minWidth:
                          235,
                        border:
                          "1px solid #e8e8f0",
                        borderRadius:
                          12,
                        background:
                          "#f8f8fb",
                        padding: 10,
                        alignSelf:
                          "start",
                      }}
                    >
                      {/* Stage Header */}

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: 8,
                          marginBottom:
                            10,
                          padding:
                            "2px 3px 9px",
                          borderBottom:
                            "1px solid #e4e4eb",
                        }}
                      >
                        <div>
                          <strong>
                            {
                              stage.label
                            }
                          </strong>

                          <small
                            style={{
                              display:
                                "block",
                              marginTop:
                                3,
                              opacity:
                                0.55,
                            }}
                          >
                            {
                              stageItems.length
                            }{" "}
                            deals
                          </small>
                        </div>

                        <span
                          style={{
                            fontSize:
                              11,
                            fontWeight:
                              800,
                            color:
                              "#6657F5",
                          }}
                        >
                          {formatMoney(
                            stageValue
                          )}
                        </span>
                      </div>

                      {/* Stage Cards */}

                      <div
                        style={{
                          display:
                            "grid",
                          gap: 9,
                        }}
                      >
                        {stageItems.length ===
                        0 ? (
                          <div
                            style={{
                              minHeight:
                                90,
                              display:
                                "grid",
                              placeItems:
                                "center",
                              border:
                                "1px dashed #d8d8e3",
                              borderRadius:
                                10,
                              color:
                                "#9ca3af",
                              fontSize:
                                12,
                              background:
                                "#fff",
                            }}
                          >
                            No deals
                          </div>
                        ) : (
                          stageItems.map(
                            (
                              opportunity
                            ) => {
                              const company =
                                getCompany(
                                  opportunity
                                );

                              const score =
                                getScore(
                                  opportunity
                                );

                              return (
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
                                    width:
                                      "100%",
                                    border:
                                      "1px solid #e5e5ed",
                                    background:
                                      "#fff",
                                    borderRadius:
                                      10,
                                    padding:
                                      12,
                                    cursor:
                                      "pointer",
                                    textAlign:
                                      "left",
                                    boxShadow:
                                      "0 1px 2px rgba(0,0,0,.02)",
                                  }}
                                >
                                  {/* Title */}

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      gap: 8,
                                      alignItems:
                                        "flex-start",
                                    }}
                                  >
                                    <strong
                                      style={{
                                        fontSize:
                                          13,
                                      }}
                                    >
                                      {opportunity.title ||
                                        `Opportunity #${opportunity.id}`}
                                    </strong>

                                    <Score
                                      n={
                                        score
                                      }
                                    />
                                  </div>

                                  {/* Company */}

                                  <div
                                    style={{
                                      marginTop:
                                        9,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize:
                                          12,
                                        fontWeight:
                                          700,
                                      }}
                                    >
                                      {company?.name ||
                                        "شركة غير معروفة"}
                                    </span>

                                    <small
                                      style={{
                                        display:
                                          "block",
                                        marginTop:
                                          2,
                                        opacity:
                                          0.55,
                                      }}
                                    >
                                      {[
                                        company?.city,
                                        company?.industry,
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " • "
                                        ) ||
                                        "—"}
                                    </small>
                                  </div>

                                  {/* Value */}

                                  <div
                                    style={{
                                      display:
                                        "flex",
                                      justifyContent:
                                        "space-between",
                                      alignItems:
                                        "center",
                                      gap: 8,
                                      marginTop:
                                        12,
                                    }}
                                  >
                                    <strong
                                      style={{
                                        color:
                                          "#111827",
                                      }}
                                    >
                                      {formatMoney(
                                        opportunity.value,
                                        opportunity.currency
                                      )}
                                    </strong>

                                    <span
                                      style={{
                                        padding:
                                          "3px 7px",
                                        borderRadius:
                                          999,
                                        background:
                                          "#f1efff",
                                        color:
                                          "#6657F5",
                                        fontSize:
                                          11,
                                        fontWeight:
                                          800,
                                      }}
                                    >
                                      {opportunity.probability ??
                                        0}
                                      %
                                    </span>
                                  </div>

                                  {/* Close Date */}

                                  <div
                                    style={{
                                      marginTop:
                                        8,
                                      paddingTop:
                                        8,
                                      borderTop:
                                        "1px solid #f0f0f4",
                                      fontSize:
                                        11,
                                      opacity:
                                        0.6,
                                    }}
                                  >
                                    Close:{" "}
                                    {formatDate(
                                      opportunity.expected_close_date
                                    )}
                                  </div>

                                  {/* Lead */}

                                  {opportunity
                                    ?.lead
                                    ?.id && (
                                    <div
                                      style={{
                                        marginTop:
                                          8,
                                      }}
                                    >
                                      <span
                                        role="button"
                                        tabIndex={
                                          0
                                        }
                                        onClick={(
                                          event
                                        ) =>
                                          openLead(
                                            event,
                                            opportunity
                                          )
                                        }
                                        onKeyDown={(
                                          event
                                        ) => {
                                          if (
                                            event.key ===
                                              "Enter" ||
                                            event.key ===
                                              " "
                                          ) {
                                            openLead(
                                              event,
                                              opportunity
                                            );
                                          }
                                        }}
                                        style={{
                                          color:
                                            "#6657F5",
                                          fontSize:
                                            11,
                                          fontWeight:
                                            800,
                                        }}
                                      >
                                        View
                                        Lead
                                      </span>
                                    </div>
                                  )}
                                </button>
                              );
                            }
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* Footer */}

          {!loading &&
            opportunities.length >
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
                  gap: 12,
                  opacity: 0.65,
                }}
              >
                <span>
                  {
                    filteredOpportunities.length
                  }{" "}
                  of{" "}
                  {
                    opportunities.length
                  }{" "}
                  opportunities
                </span>

                <span>
                  AI Sales Pipeline
                </span>
              </div>
            )}
        </Panel>
      </>
    </Shell>
  );
}