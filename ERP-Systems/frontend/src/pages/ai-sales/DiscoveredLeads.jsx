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
} from "./shared";

const API =
  "http://127.0.0.1:8000/api/ai-sales";

export default function DiscoveredLeads({
  onNavigate,
  activeView = "ai-sales-discovered",
}) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);

  /*
  |--------------------------------------------------------------------------
  | API Request
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
  | Load Discovered Companies
  |--------------------------------------------------------------------------
  */

  async function loadCompanies() {
    setLoading(true);
    setError("");

    try {
      const data = await request(
        "/companies?status=discovered&per_page=100"
      );

      /*
       * Supports:
       *
       * { data: [...] }
       *
       * and Laravel paginator:
       *
       * { data: [...], current_page: 1, ... }
       *
       * and plain array responses.
       */
      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.companies)
            ? data.companies
            : [];

      setCompanies(rows);
    } catch (err) {
      console.error(
        "Failed to load discovered companies:",
        err
      );

      setError(
        err.message ||
          "Unable to load discovered companies."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Normalize Score
  |--------------------------------------------------------------------------
  */

  function getScore(company) {
    return Number(
      company?.score?.overall_score ??
        company?.latest_score?.overall_score ??
        company?.overall_score ??
        company?.score?.overall ??
        company?.score ??
        0
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Search / Filter
  |--------------------------------------------------------------------------
  */

  const filteredCompanies = useMemo(() => {
    const term = search
      .trim()
      .toLowerCase();

    return companies.filter((company) => {
      const score = getScore(company);

      const haystack = [
        company.name,
        company.industry,
        company.category,
        company.city,
        company.region,
        company.country,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || haystack.includes(term);

      const matchesScore =
        score >= minScore;

      return matchesSearch && matchesScore;
    });
  }, [companies, search, minScore]);

  /*
  |--------------------------------------------------------------------------
  | KPIs
  |--------------------------------------------------------------------------
  */

  const totalCompanies = companies.length;

  const qualifiedCompanies =
    companies.filter(
      (company) => getScore(company) >= 60
    ).length;

  const hotCompanies =
    companies.filter(
      (company) => getScore(company) >= 85
    ).length;

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  function openCompany(company) {
    /*
     * Store selected company temporarily.
     * Later we'll move this into the AI Sales state/router.
     */
    sessionStorage.setItem(
      "ai-sales-selected-company",
      JSON.stringify(company)
    );

    onNavigate?.("ai-sales-company-360");
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
      title="Discovered Leads"
      subtitle="Review AI discoveries, evidence, scores and recommended next actions."
    >
      <>
        <div className="mini-kpis">
          <Kpi
            type="leads"
            title="Discovered"
            value={totalCompanies}
            delta=""
            note="AI discovered companies"
          />

          <Kpi
            type="companies"
            title="Qualified"
            value={qualifiedCompanies}
            delta=""
            note="Score ≥ 60"
          />

          <Kpi
            type="opportunities"
            title="Hot Leads"
            value={hotCompanies}
            delta=""
            note="Score ≥ 85"
          />
        </div>

        <Panel
          title="Lead Intelligence"
          action={
            <button
              type="button"
              onClick={loadCompanies}
              disabled={loading}
              style={{
                border: 0,
                background: "transparent",
                color: "#6657F5",
                cursor: loading
                  ? "default"
                  : "pointer",
                fontWeight: 700,
              }}
            >
              {loading
                ? "Refreshing..."
                : "Refresh"}
            </button>
          }
        >
          <div className="filterbar">
            <input
              type="search"
              placeholder="Search companies, sectors or cities..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={minScore}
              onChange={(event) =>
                setMinScore(
                  Number(event.target.value)
                )
              }
            >
              <option value={0}>
                All Scores
              </option>

              <option value={60}>
                Qualified ≥ 60
              </option>

              <option value={75}>
                Strong ≥ 75
              </option>

              <option value={85}>
                Hot ≥ 85
              </option>
            </select>

            <Btn
              secondary
              onClick={loadCompanies}
              disabled={loading}
            >
              Refresh
            </Btn>

            <Btn
              onClick={() =>
                onNavigate?.("ai-sales-discover")
              }
            >
              + Discover More
            </Btn>
          </div>

          {error && (
            <div
              style={{
                margin: "14px 0",
                padding: 14,
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

          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                opacity: 0.65,
              }}
            >
              Loading discovered companies...
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                border:
                  "1px dashed #d9dce7",
                borderRadius: 12,
                marginTop: 14,
              }}
            >
              <strong>
                No discovered companies found.
              </strong>

              <div
                style={{
                  marginTop: 6,
                  opacity: 0.65,
                }}
              >
                Run AI Discovery or change the
                current filters.
              </div>
            </div>
          ) : (
            <div className="data-table">
              <div className="tr th">
                <span>Company</span>
                <span>Industry</span>
                <span>Location</span>
                <span>AI Score</span>
                <span>Status</span>
              </div>

              {filteredCompanies.map(
                (company) => {
                  const score =
                    getScore(company);

                  return (
                    <div
                      className="tr"
                      key={company.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        openCompany(company)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key ===
                            "Enter" ||
                          event.key === " "
                        ) {
                          openCompany(company);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <b>
                        {company.name ||
                          "Unnamed Company"}
                      </b>

                      <span>
                        {company.industry ||
                          company.category ||
                          "—"}
                      </span>

                      <span>
                        {[
                          company.city,
                          company.region,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </span>

                      <Score n={score} />

                      <span
                        style={{
                          textTransform:
                            "capitalize",
                        }}
                      >
                        {company.status ||
                          "discovered"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {!loading &&
            filteredCompanies.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  opacity: 0.6,
                }}
              >
                Showing{" "}
                {filteredCompanies.length} of{" "}
                {companies.length} discovered
                companies.
              </div>
            )}
        </Panel>
      </>
    </Shell>
  );
}