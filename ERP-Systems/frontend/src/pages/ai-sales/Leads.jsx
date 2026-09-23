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

export default function Leads({
  onNavigate,
  activeView = "ai-sales-leads",
}) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");
  const [status, setStatus] =
    useState("all");
  const [priority, setPriority] =
    useState("all");

  /*
  |--------------------------------------------------------------------------
  | Load Leads
  |--------------------------------------------------------------------------
  */

  async function loadLeads() {
    setLoading(true);
    setError("");

    try {
      const data =
        await aiSalesRequest(
          "/leads?per_page=100"
        );

      const items =
        Array.isArray(data)
          ? data
          : data?.data || [];

      setLeads(items);
    } catch (err) {
      console.error(
        "Failed to load AI Sales leads:",
        err
      );

      setError(
        err.message ||
          "Unable to load leads."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter Leads
  |--------------------------------------------------------------------------
  */

  const filteredLeads =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return leads.filter(
        (lead) => {
          const company =
            lead.company || {};

          const matchesSearch =
            !query ||
            [
              company.name,
              company.industry,
              company.city,
              company.region,
              lead.contact_name,
              lead.email,
              lead.phone,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(query)
              );

          const matchesStatus =
            status === "all" ||
            lead.status === status;

          const matchesPriority =
            priority === "all" ||
            lead.priority === priority;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority
          );
        }
      );
    }, [
      leads,
      search,
      status,
      priority,
    ]);

  /*
  |--------------------------------------------------------------------------
  | KPI Calculations
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    const total = leads.length;

    const qualified =
      leads.filter(
        (lead) =>
          lead.status ===
          "qualified"
      ).length;

    const hot =
      leads.filter(
        (lead) => {
          const score =
            Number(
              lead.company
                ?.latest_score
                ?.overall_score ??
                lead
                  .qualification_score ??
                0
            );

          return (
            score >= 85 ||
            lead.priority ===
              "urgent"
          );
        }
      ).length;

    const newLeads =
      leads.filter(
        (lead) =>
          lead.status === "new"
      ).length;

    return {
      total,
      qualified,
      hot,
      newLeads,
    };
  }, [leads]);

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  function getScore(lead) {
    return Number(
      lead.company
        ?.latest_score
        ?.overall_score ??
        lead.company
          ?.latest_score
          ?.overall ??
        lead.qualification_score ??
        0
    );
  }

  function capitalize(value) {
    if (!value) {
      return "—";
    }

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
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

  /*
  |--------------------------------------------------------------------------
  | Open Lead
  |--------------------------------------------------------------------------
  */

  function openLead(lead) {
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
  | Open Company
  |--------------------------------------------------------------------------
  */

  function openCompany(
    event,
    company
  ) {
    event.stopPropagation();

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
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="Lead Management"
      subtitle="Prioritize, qualify and move AI-approved leads into the sales process."
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
              background:
                "#fef2f2",
              color: "#b91c1c",
            }}
          >
            {error}
          </div>
        )}

        {/* =====================================================
            KPI
        ===================================================== */}

        <div className="mini-kpis">
          <Kpi
            type="leads"
            title="Total Leads"
            value={stats.total}
            delta=""
            note="AI Sales leads"
          />

          <Kpi
            type="companies"
            title="New Leads"
            value={stats.newLeads}
            delta=""
            note="Awaiting qualification"
          />

          <Kpi
            type="opportunities"
            title="Qualified"
            value={stats.qualified}
            delta=""
            note="Sales qualified"
          />

          <Kpi
            type="rate"
            title="Hot Leads"
            value={stats.hot}
            delta=""
            note="Score ≥ 85 / urgent"
          />
        </div>

        {/* =====================================================
            Lead Intelligence
        ===================================================== */}

        <Panel
          title="Lead Intelligence"
          action={
            <button
              type="button"
              onClick={loadLeads}
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
                ? "Loading..."
                : "Refresh"}
            </button>
          }
        >
          {/* ===================================================
              Filters
          =================================================== */}

          <div
            className="filterbar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                position:
                  "relative",
                flex: "1 1 260px",
              }}
            >
              <uiIcons.Search
                size={17}
                style={{
                  position:
                    "absolute",
                  left: 12,
                  top: "50%",
                  transform:
                    "translateY(-50%)",
                  opacity: 0.45,
                }}
              />

              <input
                type="text"
                placeholder="Search companies, sectors, cities or contacts..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                style={{
                  width: "100%",
                  paddingLeft: 38,
                }}
              />
            </div>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value
                )
              }
            >
              <option value="all">
                All Statuses
              </option>

              <option value="new">
                New
              </option>

              <option value="qualified">
                Qualified
              </option>

              <option value="contacted">
                Contacted
              </option>

              <option value="nurturing">
                Nurturing
              </option>

              <option value="converted">
                Converted
              </option>

              <option value="lost">
                Lost
              </option>
            </select>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(
                  e.target.value
                )
              }
            >
              <option value="all">
                All Priorities
              </option>

              <option value="urgent">
                Urgent
              </option>

              <option value="high">
                High
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="low">
                Low
              </option>
            </select>
          </div>

          {/* ===================================================
              Loading
          =================================================== */}

          {loading ? (
            <div
              style={{
                padding: 45,
                textAlign:
                  "center",
                opacity: 0.65,
              }}
            >
              Loading AI Sales
              leads...
            </div>
          ) : !leads.length ? (
            /* =================================================
                Empty
            ================================================= */

            <div
              style={{
                padding: 45,
                textAlign:
                  "center",
              }}
            >
              <uiIcons.Users
                size={34}
                style={{
                  opacity: 0.35,
                  marginBottom: 10,
                }}
              />

              <h3
                style={{
                  margin:
                    "0 0 8px",
                }}
              >
                No leads yet
              </h3>

              <p
                style={{
                  opacity: 0.65,
                }}
              >
                Discover companies and
                convert qualified
                accounts into leads.
              </p>

              <Btn
                onClick={() =>
                  onNavigate?.(
                    "ai-sales-discover"
                  )
                }
              >
                Discover Leads
              </Btn>
            </div>
          ) : !filteredLeads
              .length ? (
            /* =================================================
                No Search Results
            ================================================= */

            <div
              style={{
                padding: 40,
                textAlign:
                  "center",
              }}
            >
              <strong>
                No leads match the
                selected filters.
              </strong>

              <div
                style={{
                  marginTop: 12,
                }}
              >
                <Btn
                  secondary
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                    setPriority(
                      "all"
                    );
                  }}
                >
                  Clear Filters
                </Btn>
              </div>
            </div>
          ) : (
            /* =================================================
                Leads Table
            ================================================= */

            <div
              style={{
                overflowX:
                  "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      textAlign:
                        "left",
                      borderBottom:
                        "1px solid #e5e7eb",
                    }}
                  >
                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      Company
                    </th>

                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      AI Score
                    </th>

                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      Priority
                    </th>

                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      Status
                    </th>

                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      Contact
                    </th>

                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      Created
                    </th>

                    <th
                      style={{
                        padding:
                          "12px 10px",
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map(
                    (lead) => {
                      const company =
                        lead.company ||
                        {};

                      const score =
                        getScore(
                          lead
                        );

                      return (
                        <tr
                          key={
                            lead.id
                          }
                          onClick={() =>
                            openLead(
                              lead
                            )
                          }
                          style={{
                            borderBottom:
                              "1px solid #f0f0f4",
                            cursor:
                              "pointer",
                          }}
                        >
                          {/* Company */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                gap: 10,
                                alignItems:
                                  "center",
                              }}
                            >
                              <div
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius:
                                    10,
                                  display:
                                    "grid",
                                  placeItems:
                                    "center",
                                  background:
                                    "#f1efff",
                                  color:
                                    "#6657F5",
                                  flexShrink: 0,
                                }}
                              >
                                <uiIcons.Building2
                                  size={
                                    18
                                  }
                                />
                              </div>

                              <div>
                                <button
                                  type="button"
                                  onClick={(
                                    event
                                  ) =>
                                    openCompany(
                                      event,
                                      company
                                    )
                                  }
                                  style={{
                                    border:
                                      0,
                                    padding:
                                      0,
                                    background:
                                      "transparent",
                                    cursor:
                                      "pointer",
                                    fontWeight:
                                      800,
                                    color:
                                      "#111827",
                                  }}
                                >
                                  {company.name ||
                                    "Unnamed Company"}
                                </button>

                                <small
                                  style={{
                                    display:
                                      "block",
                                    marginTop:
                                      3,
                                    opacity:
                                      0.6,
                                  }}
                                >
                                  {[
                                    company.city,
                                    company.industry,
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
                            </div>
                          </td>

                          {/* Score */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            <Score
                              n={
                                score
                              }
                            />
                          </td>

                          {/* Priority */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            <span
                              style={{
                                textTransform:
                                  "capitalize",
                                fontWeight:
                                  700,
                              }}
                            >
                              {capitalize(
                                lead.priority
                              )}
                            </span>
                          </td>

                          {/* Status */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                padding:
                                  "5px 9px",
                                borderRadius:
                                  999,
                                background:
                                  "#f1efff",
                                color:
                                  "#6657F5",
                                fontSize:
                                  12,
                                fontWeight:
                                  700,
                                textTransform:
                                  "capitalize",
                              }}
                            >
                              {lead.status ||
                                "new"}
                            </span>
                          </td>

                          {/* Contact */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            <div>
                              <b>
                                {lead.contact_name ||
                                  "Not identified"}
                              </b>

                              <small
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    3,
                                  opacity:
                                    0.6,
                                }}
                              >
                                {lead.email ||
                                  lead.phone ||
                                  "—"}
                              </small>
                            </div>
                          </td>

                          {/* Created */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            {formatDate(
                              lead.created_at
                            )}
                          </td>

                          {/* Action */}

                          <td
                            style={{
                              padding:
                                "14px 10px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={(
                                event
                              ) => {
                                event.stopPropagation();

                                openLead(
                                  lead
                                );
                              }}
                              style={{
                                border:
                                  "1px solid #ddd9ff",
                                background:
                                  "#fff",
                                color:
                                  "#6657F5",
                                borderRadius:
                                  8,
                                padding:
                                  "7px 10px",
                                cursor:
                                  "pointer",
                                fontWeight:
                                  700,
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ===================================================
              Footer
          =================================================== */}

          {!loading &&
            leads.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop:
                    "1px solid #eeeef3",
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: 10,
                  opacity: 0.7,
                }}
              >
                <span>
                  Showing{" "}
                  {
                    filteredLeads.length
                  }{" "}
                  of {leads.length} leads
                </span>

                <span>
                  AI Sales Lead
                  Management
                </span>
              </div>
            )}
        </Panel>
      </>
    </Shell>
  );
}