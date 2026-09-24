import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CircleDollarSign,
  Crosshair,
  MapPin,
  RefreshCw,
  Route,
  Signal,
  Target,
  TrendingUp,
  Users,
  Plus,
  Pencil,
  Power,
  X,
} from "lucide-react";
import { Shell } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: Number(value) >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value || 0));


const companyIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#6657f5;border:3px solid #fff;box-shadow:0 5px 14px rgba(44,37,110,.28);display:grid;place-items:center"><span style="width:7px;height:7px;border-radius:50%;background:#fff"></span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

function FitCompanyMarkers({ companies }) {
  const map = useMap();
  useEffect(() => {
    const points = companies
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => [Number(c.latitude), Number(c.longitude)]);
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(points, { padding: [42, 42], maxZoom: 13 });
  }, [companies, map]);
  return null;
}

export default function MapTerritories({
  onNavigate,
  activeView = "ai-sales-map",
}) {
  const [payload, setPayload] = useState({
    data: [],
    summary: {},
    unassigned: {},
  });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "",
    region: "",
    cities: "",
    industries: "",
    target_value: "",
    is_active: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await aiSalesRequest("/territories");

      setPayload({
        data: Array.isArray(result?.data) ? result.data : [],
        summary: result?.summary || {},
        unassigned: result?.unassigned || {},
      });

      if (!selectedId && result?.data?.length) {
        setSelectedId(result.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load territory intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () =>
      payload.data.find((item) => item.id === selectedId) ||
      payload.data[0] ||
      null,
    [payload.data, selectedId]
  );

  const maxCompanies = Math.max(
    1,
    ...payload.data.map((item) => Number(item.companies || 0))
  );

  const [mapFilters, setMapFilters] = useState({
    search: "",
    industry: "all",
    minScore: 0,
    hasSignals: false,
  });

  const mapCompanies = useMemo(
    () => selected?.map_companies || [],
    [selected]
  );

  const industries = useMemo(
    () =>
      [...new Set(mapCompanies.map((company) => company.industry).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [mapCompanies]
  );

  const geoCompanies = useMemo(() => {
    const search = mapFilters.search.trim().toLowerCase();

    return mapCompanies.filter((company) => {
      if (company.latitude == null || company.longitude == null) return false;
      if (
        search &&
        ![company.name, company.city, company.region, company.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(search)
      ) return false;
      if (mapFilters.industry !== "all" && company.industry !== mapFilters.industry) {
        return false;
      }
      if (Number(company.ai_score || 0) < Number(mapFilters.minScore || 0)) {
        return false;
      }
      if (mapFilters.hasSignals && Number(company.signals || 0) < 1) {
        return false;
      }
      return true;
    });
  }, [mapCompanies, mapFilters]);

  const plottedCompanies = useMemo(() => {
    const groups = new Map();

    geoCompanies.forEach((company) => {
      const key = `${Number(company.latitude).toFixed(5)}:${Number(company.longitude).toFixed(5)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(company);
    });

    const result = [];
    groups.forEach((group) => {
      group.forEach((company, index) => {
        if (group.length === 1) {
          result.push({ ...company, plot_latitude: Number(company.latitude), plot_longitude: Number(company.longitude) });
          return;
        }

        const angle = (Math.PI * 2 * index) / group.length;
        const radius = 0.0022;
        result.push({
          ...company,
          plot_latitude: Number(company.latitude) + Math.sin(angle) * radius,
          plot_longitude: Number(company.longitude) + Math.cos(angle) * radius,
        });
      });
    });

    return result;
  }, [geoCompanies]);

  const fallbackCenter = useMemo(() => {
    if (geoCompanies.length) {
      return [Number(geoCompanies[0].latitude), Number(geoCompanies[0].longitude)];
    }
    return [24.7136, 46.6753];
  }, [geoCompanies]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      country: "",
      region: "",
      cities: "",
      industries: "",
      target_value: "",
      is_active: true,
    });
    setEditorOpen(true);
  };

  const openEdit = (territory) => {
    setEditing(territory);
    setForm({
      name: territory.name || "",
      country: territory.country || "",
      region: territory.region || "",
      cities: (territory.cities_filter || []).join(", "),
      industries: (territory.industries || []).join(", "),
      target_value: territory.target_value || "",
      is_active: true,
    });
    setEditorOpen(true);
  };

  const splitList = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const saveTerritory = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;

    try {
      setSaving(true);
      setError("");

      const body = {
        name: form.name.trim(),
        country: form.country.trim() || null,
        region: form.region.trim() || null,
        cities: splitList(form.cities),
        industries: splitList(form.industries),
        target_value: form.target_value === "" ? 0 : Number(form.target_value),
        is_active: Boolean(form.is_active),
      };

      await aiSalesRequest(
        editing ? `/territories/${editing.id}` : "/territories",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      setEditorOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to save territory.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateTerritory = async (territory) => {
    if (!window.confirm(`Deactivate "${territory.name}"?`)) return;

    try {
      setError("");
      await aiSalesRequest(`/territories/${territory.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: false }),
      });
      if (selectedId === territory.id) setSelectedId(null);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to deactivate territory.");
    }
  };

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="Territory Intelligence"
      subtitle="Turn ERP geography into sales coverage, pipeline concentration and territory performance."
    >
      <div style={styles.page}>
        <div style={styles.toolbar}>
          <div>
            <div style={styles.eyebrow}>LIVE ERP GEOGRAPHY</div>
            <div style={styles.toolbarTitle}>
              Territory & Market Coverage
            </div>
          </div>

          <div style={styles.toolbarActions}>
            <button style={styles.primaryButton} onClick={openCreate}>
              <Plus size={16} />
              New Territory
            </button>
            <button style={styles.refresh} onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.kpis}>
          <Metric
            icon={Route}
            label="Active Territories"
            value={number(payload.summary.territories)}
            hint={`${number(payload.unassigned?.companies)} unassigned companies`}
          />
          <Metric
            icon={Building2}
            label="Companies"
            value={number(payload.summary.companies)}
            hint="Discovered accounts"
          />
          <Metric
            icon={Users}
            label="Leads"
            value={number(payload.summary.leads)}
            hint={`${number(payload.summary.opportunities)} opportunities`}
          />
          <Metric
            icon={CircleDollarSign}
            label="Pipeline Value"
            value={`SAR ${money(payload.summary.pipeline_value)}`}
            hint={`Weighted SAR ${money(payload.summary.weighted_value)}`}
          />
          <Metric
            icon={Signal}
            label="Signals"
            value={number(payload.summary.signals)}
            hint="Market activity"
          />
          <Metric
            icon={Target}
            label="Avg AI Score"
            value={`${number(payload.summary.average_ai_score)}/100`}
            hint="Across scored companies"
          />
        </div>

        <div style={styles.mainGrid}>
          <section style={styles.mapCard}>
            <div style={styles.cardHeader}>
              <div>
                <div>
                  <b style={{ display: "block", color: "#17213b" }}>Live Company Map</b>
                  <span style={{ display: "block", marginTop: 3, color: "#8a92a6", fontSize: 10 }}>OpenStreetMap • real company coordinates</span>
                </div>
              </div>
              <Crosshair size={18} />
            </div>

            <div style={styles.mapFilterBar}>
              <input
                style={styles.mapFilterInput}
                value={mapFilters.search}
                onChange={(e) => setMapFilters((current) => ({ ...current, search: e.target.value }))}
                placeholder="Search company or city..."
              />
              <select
                style={styles.mapFilterSelect}
                value={mapFilters.industry}
                onChange={(e) => setMapFilters((current) => ({ ...current, industry: e.target.value }))}
              >
                <option value="all">All industries</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
              <label style={styles.scoreFilter}>
                <span>AI Score ≥ {mapFilters.minScore}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={mapFilters.minScore}
                  onChange={(e) => setMapFilters((current) => ({ ...current, minScore: Number(e.target.value) }))}
                />
              </label>
              <label style={styles.signalFilter}>
                <input
                  type="checkbox"
                  checked={mapFilters.hasSignals}
                  onChange={(e) => setMapFilters((current) => ({ ...current, hasSignals: e.target.checked }))}
                />
                Has signals
              </label>
            </div>

            <div style={styles.realMapWrap}>
              <MapContainer center={fallbackCenter} zoom={geoCompanies.length ? 11 : 5} scrollWheelZoom style={{ width: "100%", height: "100%" }}>
                <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitCompanyMarkers companies={plottedCompanies.map((company) => ({ ...company, latitude: company.plot_latitude, longitude: company.plot_longitude }))} />
                {plottedCompanies.map((company) => (
                  <Marker key={company.id} position={[Number(company.plot_latitude), Number(company.plot_longitude)]} icon={companyIcon}>
                    <Popup>
                      <div style={{ minWidth: 210 }}>
                        <strong>{company.name}</strong>
                        <div style={{ marginTop: 5, color: "#667085", fontSize: 11 }}>
                          {[company.city, company.industry].filter(Boolean).join(" • ") || "Company"}
                        </div>
                        <div style={{ marginTop: 9, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
                          <span>AI Score <b>{number(company.ai_score)}</b></span>
                          <span>Signals <b>{number(company.signals)}</b></span>
                          <span>Leads <b>{number(company.leads)}</b></span>
                          <span>Opps <b>{number(company.opportunities)}</b></span>
                        </div>
                        <button type="button" onClick={() => {
                          sessionStorage.setItem("aiSalesSelectedCompanyId", String(company.id));
                          onNavigate?.("ai-sales-company");
                        }} style={{ marginTop: 10, width: "100%", height: 32, border: 0, borderRadius: 8, background: "#6657f5", color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                          Open Company 360
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {!geoCompanies.length && (
                <div style={styles.mapOverlayEmpty}>
                  <MapPin size={24} />
                  <b>No geocoded companies in this territory</b>
                  <span>Run company geocoding, then refresh this page.</span>
                </div>
              )}

              {selected && (
                <div style={styles.realMapLegend}>
                  <MapPin size={15} />
                  <div>
                    <b>{selected.name}</b>
                    <span>{geoCompanies.length} visible • {mapCompanies.length} mapped • {number(selected.companies)} total</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section style={styles.performanceCard}>
            <div style={styles.cardHeader}>
              <div>
                <div>
                  <b style={{ display: "block", color: "#17213b" }}>Territory Performance</b>
                  <span style={{ display: "block", marginTop: 3, color: "#8a92a6", fontSize: 10 }}>Coverage and commercial concentration</span>
                </div>
              </div>
              <TrendingUp size={18} />
            </div>

            <div style={styles.territoryList}>
              {payload.data.map((territory) => {
                const active = selected?.id === territory.id;
                const percent =
                  territory.target_achievement ??
                  Math.round(
                    (Number(territory.companies || 0) / maxCompanies) * 100
                  );

                return (
                  <button
                    key={territory.id}
                    onClick={() => setSelectedId(territory.id)}
                    style={{
                      ...styles.territoryRow,
                      ...(active ? styles.territoryRowActive : {}),
                    }}
                  >
                    <div style={styles.rowTop}>
                      <div>
                        <b>{territory.name}</b>
                        <span>
                          {number(territory.companies)} companies •{" "}
                          {number(territory.leads)} leads
                        </span>
                      </div>
                      <strong>
                        SAR {money(territory.pipeline_value)}
                      </strong>
                    </div>
                    <div style={styles.track}>
                      <i
                        style={{
                          ...styles.fill,
                          width: `${Math.min(100, Math.max(3, percent))}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {selected && (
          <>
            <div style={styles.detailGrid}>
              <Detail
                label="Companies"
                value={number(selected.companies)}
              />
              <Detail label="Leads" value={number(selected.leads)} />
              <Detail
                label="Opportunities"
                value={number(selected.opportunities)}
              />
              <Detail
                label="Pipeline"
                value={`SAR ${money(selected.pipeline_value)}`}
              />
              <Detail
                label="Weighted"
                value={`SAR ${money(selected.weighted_value)}`}
              />
              <Detail
                label="AI Score"
                value={`${number(selected.average_ai_score)}/100`}
              />
            </div>

            <div style={styles.bottomGrid}>
              <section style={styles.panel}>
                <div style={styles.panelTitle}>
                  <div>
                    <b>City Breakdown</b>
                    <span>Live concentration inside {selected.name}</span>
                  </div>
                  <MapPin size={17} />
                </div>

                {selected.cities?.length ? (
                  selected.cities.map((city) => (
                    <div key={city.city} style={styles.cityRow}>
                      <div>
                        <b>{city.city}</b>
                        <span>
                          {number(city.companies)} companies •{" "}
                          {number(city.leads)} leads •{" "}
                          {number(city.opportunities)} opportunities
                        </span>
                      </div>
                      <strong>SAR {money(city.pipeline_value)}</strong>
                    </div>
                  ))
                ) : (
                  <Empty text="No city-level company data in this territory." />
                )}
              </section>

              <section style={styles.panel}>
                <div style={styles.panelTitle}>
                  <div>
                    <b>Top Companies</b>
                    <span>Ranked by latest AI score</span>
                  </div>
                  <Target size={17} />
                </div>

                {selected.top_companies?.length ? (
                  selected.top_companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        sessionStorage.setItem(
                          "aiSalesSelectedCompanyId",
                          String(company.id)
                        );
                        onNavigate?.("ai-sales-company");
                      }}
                      style={styles.companyRow}
                    >
                      <div>
                        <b>{company.name}</b>
                        <span>
                          {[company.city, company.industry]
                            .filter(Boolean)
                            .join(" • ") || "Company"}
                        </span>
                      </div>
                      <div style={styles.companyMetrics}>
                        <small>
                          {number(company.opportunities)} opps
                        </small>
                        <strong>{number(company.ai_score)}</strong>
                      </div>
                    </button>
                  ))
                ) : (
                  <Empty text="No companies matched this territory yet." />
                )}
              </section>
            </div>

            <section style={styles.coveragePanel}>
              <div>
                <b>Territory Definition</b>
                <span>
                  Country: {selected.country || "Any"} • Region:{" "}
                  {selected.region || "Any"} • Cities:{" "}
                  {selected.cities_filter?.length
                    ? selected.cities_filter.join(", ")
                    : "Any"}
                </span>
              </div>

              <div style={styles.coverageStats}>
                <span>
                  <Signal size={14} />
                  {number(selected.signals)} signals
                </span>
                <span>
                  <Target size={14} />
                  Target{" "}
                  {selected.target_value
                    ? `SAR ${money(selected.target_value)}`
                    : "not set"}
                </span>
                <button style={styles.inlineAction} onClick={() => openEdit(selected)}>
                  <Pencil size={13} /> Edit
                </button>
                <button
                  style={{ ...styles.inlineAction, ...styles.dangerAction }}
                  onClick={() => deactivateTerritory(selected)}
                >
                  <Power size={13} /> Deactivate
                </button>
              </div>
            </section>
          </>
        )}

        {editorOpen && (
          <div style={styles.modalBackdrop} onMouseDown={() => setEditorOpen(false)}>
            <form
              style={styles.modal}
              onSubmit={saveTerritory}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div>
                  <div style={styles.eyebrow}>TERRITORY MANAGEMENT</div>
                  <h3 style={styles.modalTitle}>
                    {editing ? "Edit Territory" : "Create Territory"}
                  </h3>
                </div>
                <button
                  type="button"
                  style={styles.iconButton}
                  onClick={() => setEditorOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={styles.formGrid}>
                <Field label="Territory Name *">
                  <input
                    style={styles.input}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Eastern Region Enterprise"
                    required
                  />
                </Field>
                <Field label="Country">
                  <input
                    style={styles.input}
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Country"
                  />
                </Field>
                <Field label="Region">
                  <input
                    style={styles.input}
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    placeholder="Region / State / Province"
                  />
                </Field>
                <Field label="Sales Target">
                  <input
                    style={styles.input}
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.target_value}
                    onChange={(e) =>
                      setForm({ ...form, target_value: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Cities" wide>
                  <input
                    style={styles.input}
                    value={form.cities}
                    onChange={(e) => setForm({ ...form, cities: e.target.value })}
                    placeholder="Comma separated: City A, City B, City C"
                  />
                </Field>
                <Field label="Industries" wide>
                  <input
                    style={styles.input}
                    value={form.industries}
                    onChange={(e) =>
                      setForm({ ...form, industries: e.target.value })
                    }
                    placeholder="Optional, comma separated"
                  />
                </Field>
              </div>

              <div style={styles.formNote}>
                Companies are matched automatically using country, region, city and
                optional industry criteria. Leave a field empty when it should not
                restrict the territory.
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setEditorOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryButton}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Territory"}
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
        <span style={styles.metricLabel}>{label}</span>
        <strong style={styles.metricValue}>{value}</strong>
        <small style={styles.metricHint}>{hint}</small>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detail}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Field({ label, wide = false, children }) {
  return (
    <label style={{ ...styles.field, ...(wide ? styles.fieldWide : {}) }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Empty({ text }) {
  return <div style={styles.empty}>{text}</div>;
}

const styles = {
  page: {
    display: "grid",
    gap: 14,
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#6657f5",
  },
  toolbarTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: 800,
    color: "#18213a",
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  primaryButton: {
    height: 38,
    padding: "0 14px",
    borderRadius: 9,
    border: "1px solid #6657f5",
    background: "#6657f5",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 800,
  },
  refresh: {
    height: 38,
    padding: "0 14px",
    borderRadius: 9,
    border: "1px solid #dfe3ee",
    background: "#fff",
    color: "#344054",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
  },
  error: {
    padding: "11px 13px",
    borderRadius: 10,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    fontSize: 12,
  },
  kpis: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 10,
  },
  metric: {
    minWidth: 0,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #e6e8f1",
    background: "#fff",
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    background: "#f0edff",
    color: "#6657f5",
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
  },
  metricLabel: {
    display: "block",
    color: "#7c8498",
    fontSize: 10,
    textTransform: "uppercase",
  },
  metricValue: {
    display: "block",
    marginTop: 3,
    color: "#17213b",
    fontSize: 17,
  },
  metricHint: {
    display: "block",
    marginTop: 3,
    color: "#9aa1b2",
    fontSize: 9,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, .75fr)",
    gap: 12,
  },
  mapCard: {
    background: "#fff",
    border: "1px solid #e5e8f1",
    borderRadius: 15,
    overflow: "hidden",
  },
  performanceCard: {
    background: "#fff",
    border: "1px solid #e5e8f1",
    borderRadius: 15,
    overflow: "hidden",
  },
  cardHeader: {
    minHeight: 58,
    padding: "0 16px",
    borderBottom: "1px solid #edf0f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: "#6657f5",
  },
  mapFilterBar: {
    padding: "10px 12px",
    borderBottom: "1px solid #eef0f5",
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    background: "#fff",
  },
  mapFilterInput: {
    height: 34,
    minWidth: 190,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid #dfe3eb",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 11,
  },
  mapFilterSelect: {
    height: 34,
    minWidth: 145,
    padding: "0 9px",
    borderRadius: 8,
    border: "1px solid #dfe3eb",
    background: "#fff",
    fontFamily: "inherit",
    fontSize: 11,
  },
  scoreFilter: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: "#667085",
    fontSize: 10,
    fontWeight: 700,
  },
  signalFilter: {
    height: 34,
    padding: "0 9px",
    borderRadius: 8,
    border: "1px solid #e4e7ec",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "#667085",
    fontSize: 10,
    fontWeight: 700,
  },
  realMapWrap: {
    height: 430,
    position: "relative",
    overflow: "hidden",
  },
  realMapLegend: {
    position: "absolute",
    zIndex: 500,
    left: 14,
    bottom: 14,
    padding: "9px 11px",
    borderRadius: 10,
    background: "rgba(255,255,255,.94)",
    border: "1px solid #e6e8f1",
    boxShadow: "0 8px 24px rgba(16,24,40,.12)",
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: "#6657f5",
  },
  mapOverlayEmpty: {
    position: "absolute",
    zIndex: 600,
    left: "50%",
    top: "50%",
    transform: "translate(-50%,-50%)",
    width: 300,
    padding: 16,
    borderRadius: 14,
    background: "rgba(255,255,255,.94)",
    border: "1px solid #e6e8f1",
    boxShadow: "0 12px 30px rgba(16,24,40,.12)",
    display: "grid",
    gap: 6,
    placeItems: "center",
    textAlign: "center",
    color: "#667085",
  },
  mapSurface: {
    minHeight: 390,
    position: "relative",
    overflow: "hidden",
    background:
      "radial-gradient(circle at 25% 20%, rgba(102,87,245,.09), transparent 22%), radial-gradient(circle at 72% 68%, rgba(102,87,245,.08), transparent 24%), #f8f9fd",
  },
  road: {
    position: "absolute",
    width: "90%",
    height: 2,
    background: "#e7e9f2",
  },
  roadVertical: {
    position: "absolute",
    width: 2,
    height: "90%",
    background: "#e7e9f2",
    transform: "rotate(9deg)",
  },
  bubble: {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    color: "#5547e8",
    display: "grid",
    placeContent: "center",
    textAlign: "center",
    cursor: "pointer",
    fontFamily: "inherit",
    boxShadow: "0 8px 28px rgba(102,87,245,.12)",
  },
  mapLegend: {
    position: "absolute",
    left: 14,
    bottom: 14,
    padding: "10px 12px",
    borderRadius: 11,
    background: "rgba(255,255,255,.92)",
    border: "1px solid #e6e8f1",
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#6657f5",
  },
  emptyMap: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeContent: "center",
    textAlign: "center",
    gap: 7,
    color: "#7c8498",
    padding: 30,
  },
  territoryList: {
    padding: 10,
    display: "grid",
    gap: 7,
  },
  territoryRow: {
    width: "100%",
    border: "1px solid transparent",
    background: "#fff",
    borderRadius: 11,
    padding: 10,
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  territoryRowActive: {
    borderColor: "#ddd7ff",
    background: "#faf9ff",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  track: {
    height: 5,
    marginTop: 9,
    background: "#eff1f6",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    display: "block",
    height: "100%",
    background: "#6657f5",
    borderRadius: 999,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: 10,
  },
  detail: {
    padding: "13px 14px",
    border: "1px solid #e6e8f1",
    borderRadius: 12,
    background: "#fff",
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  panel: {
    border: "1px solid #e6e8f1",
    borderRadius: 14,
    background: "#fff",
    padding: 14,
  },
  panelTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 11,
    borderBottom: "1px solid #eef0f5",
    color: "#6657f5",
  },
  cityRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "11px 2px",
    borderBottom: "1px solid #f0f1f5",
  },
  companyRow: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: "11px 2px",
    border: 0,
    borderBottom: "1px solid #f0f1f5",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  companyMetrics: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  coveragePanel: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid #ded9ff",
    background: "#faf9ff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  coverageStats: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  empty: {
    padding: "22px 4px",
    textAlign: "center",
    color: "#9299aa",
    fontSize: 12,
  },
  inlineAction: {
    height: 30,
    padding: "0 9px",
    borderRadius: 8,
    border: "1px solid #ddd9ff",
    background: "#fff",
    color: "#5d50dc",
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 11,
  },
  dangerAction: {
    borderColor: "#fecdd3",
    color: "#be123c",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(16,24,40,.36)",
    backdropFilter: "blur(2px)",
    display: "grid",
    placeItems: "center",
    padding: 20,
  },
  modal: {
    width: "min(720px, 96vw)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e4e7ec",
    boxShadow: "0 24px 70px rgba(16,24,40,.18)",
  },
  modalHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #eef0f5",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    margin: "4px 0 0",
    color: "#17213b",
    fontSize: 20,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    border: "1px solid #e4e7ec",
    background: "#fff",
    color: "#667085",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  },
  formGrid: {
    padding: 20,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  field: {
    display: "grid",
    gap: 6,
    color: "#475467",
    fontSize: 11,
    fontWeight: 700,
  },
  fieldWide: {
    gridColumn: "1 / -1",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    height: 40,
    padding: "0 11px",
    border: "1px solid #dfe3eb",
    borderRadius: 9,
    outline: "none",
    background: "#fff",
    color: "#17213b",
    fontFamily: "inherit",
  },
  formNote: {
    margin: "0 20px 18px",
    padding: 11,
    borderRadius: 10,
    background: "#f7f5ff",
    color: "#6257a8",
    fontSize: 11,
    lineHeight: 1.6,
  },
  modalFooter: {
    padding: "14px 20px",
    borderTop: "1px solid #eef0f5",
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    height: 38,
    padding: "0 14px",
    borderRadius: 9,
    border: "1px solid #dfe3eb",
    background: "#fff",
    color: "#475467",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: 700,
  },
};