import { useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  CircleDollarSign,
  Crosshair,
  Layers3,
  MapPin,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  Signal,
  Target,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Shell } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const PURPLE = "#6657f5";
const DEFAULT_CENTER = [24.7136, 46.6753];

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: Number(value) >= 1000000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const number = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value || 0));

const companyIcon = L.divIcon({
  className: "",
  html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${PURPLE};border:3px solid #fff;box-shadow:0 5px 14px rgba(44,37,110,.28);display:grid;place-items:center"><span style="width:7px;height:7px;border-radius:50%;background:#fff"></span></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

function MapController({ controllerRef }) {
  const map = useMap();

  useEffect(() => {
    controllerRef.current = map;
    return () => {
      controllerRef.current = null;
    };
  }, [map, controllerRef]);

  return null;
}

function FitCompanyMarkers({ companies, nonce = 0 }) {
  const map = useMap();

  useEffect(() => {
    const points = companies
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => [Number(c.displayLatitude ?? c.latitude), Number(c.displayLongitude ?? c.longitude)]);

    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }

    map.fitBounds(points, {
      padding: [48, 48],
      maxZoom: 13,
    });
  }, [companies, map, nonce]);

  return null;
}

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function offsetOverlaps(companies) {
  const groups = new Map();

  companies.forEach((company) => {
    const lat = Number(company.latitude);
    const lng = Number(company.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const key = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(company);
  });

  return companies.map((company) => {
    const lat = Number(company.latitude);
    const lng = Number(company.longitude);
    const key = `${lat.toFixed(6)}:${lng.toFixed(6)}`;
    const group = groups.get(key) || [];
    const index = group.findIndex((item) => item.id === company.id);

    if (group.length <= 1 || index < 0) {
      return {
        ...company,
        displayLatitude: lat,
        displayLongitude: lng,
      };
    }

    const angle = (Math.PI * 2 * index) / group.length;
    const radius = 0.0022;

    return {
      ...company,
      displayLatitude: lat + Math.sin(angle) * radius,
      displayLongitude: lng + Math.cos(angle) * radius,
    };
  });
}

function PopupContent({ company, onNavigate }) {
  const currency = company.currency || "SAR";

  return (
    <div style={{ minWidth: 220, fontFamily: "inherit" }}>
      <div style={{ fontWeight: 900, fontSize: 14, color: "#17213b" }}>
        {company.name}
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#667085" }}>
        {[company.city, company.region, company.industry]
          .filter(Boolean)
          .join(" • ") || "Company"}
      </div>

      <div style={styles.popupGrid}>
        <PopupStat label="AI Score" value={`${number(company.ai_score)}/100`} />
        <PopupStat label="Leads" value={number(company.leads)} />
        <PopupStat label="Opps" value={number(company.opportunities)} />
        <PopupStat label="Signals" value={number(company.signals)} />
        <PopupStat
          label="Pipeline"
          value={`${currency} ${money(company.pipeline_value)}`}
        />
        <PopupStat
          label="Weighted"
          value={`${currency} ${money(company.weighted_pipeline)}`}
        />
      </div>

      <button
        style={styles.popupButton}
        onClick={() => {
          sessionStorage.setItem(
            "aiSalesSelectedCompanyId",
            String(company.id)
          );
          onNavigate?.("ai-sales-company");
        }}
      >
        Open Company 360
      </button>
    </div>
  );
}

function PopupStat({ label, value }) {
  return (
    <div style={styles.popupStat}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

export default function MapTerritories({ onNavigate }) {
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
  const [fitNonce, setFitNonce] = useState(0);

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [hasSignals, setHasSignals] = useState(false);

  const [layers, setLayers] = useState({
    companies: true,
    leads: false,
    opportunities: false,
    signals: false,
    pipeline: false,
  });

  const mapRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    country: "",
    region: "",
    cities: "",
    industries: "",
    target_value: "",
  });

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await aiSalesRequest("/territories");
      setPayload(result || { data: [], summary: {}, unassigned: {} });

      const rows = result?.data || [];
      setSelectedId((current) => {
        if (current && rows.some((row) => row.id === current)) return current;
        return rows[0]?.id ?? null;
      });
    } catch (err) {
      setError(err?.message || "Unable to load territory intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const territories = payload.data || [];
  const summary = payload.summary || {};

  const selected = useMemo(
    () => territories.find((row) => row.id === selectedId) || territories[0] || null,
    [territories, selectedId]
  );

  const allCompanies = useMemo(
    () => offsetOverlaps(selected?.map_companies || []),
    [selected]
  );

  const industries = useMemo(
    () =>
      [...new Set(allCompanies.map((c) => c.industry).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b)),
    [allCompanies]
  );

  const visibleCompanies = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return allCompanies.filter((company) => {
      const haystack = [
        company.name,
        company.city,
        company.region,
        company.country,
        company.industry,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (needle && !haystack.includes(needle)) return false;
      if (industry && company.industry !== industry) return false;
      if (Number(company.ai_score || 0) < Number(minScore || 0)) return false;
      if (hasSignals && Number(company.signals || 0) <= 0) return false;
      return true;
    });
  }, [allCompanies, search, industry, minScore, hasSignals]);

  const mappedTotal = allCompanies.length;

  const resetFilters = () => {
    setSearch("");
    setIndustry("");
    setMinScore(0);
    setHasSignals(false);
  };

  const fitTerritory = () => setFitNonce((value) => value + 1);

  const resetView = () => {
    mapRef.current?.setView(DEFAULT_CENTER, 5);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      country: "",
      region: "",
      cities: "",
      industries: "",
      target_value: "",
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
    });
    setEditorOpen(true);
  };

  const saveTerritory = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name: form.name.trim(),
      country: form.country.trim() || null,
      region: form.region.trim() || null,
      cities: splitCsv(form.cities),
      industries: splitCsv(form.industries),
      target_value:
        form.target_value === "" ? null : Number(form.target_value),
      is_active: true,
    };

    try {
      if (editing) {
        await aiSalesRequest(`/territories/${editing.id}`, {
          method: "PUT",
          body,
        });
      } else {
        await aiSalesRequest("/territories", {
          method: "POST",
          body,
        });
      }

      setEditorOpen(false);
      await load();
    } catch (err) {
      setError(err?.message || "Unable to save territory.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateTerritory = async (territory) => {
    if (!window.confirm(`Deactivate "${territory.name}"?`)) return;

    try {
      await aiSalesRequest(`/territories/${territory.id}`, {
        method: "PUT",
        body: { is_active: false },
      });
      await load();
    } catch (err) {
      setError(err?.message || "Unable to deactivate territory.");
    }
  };

  const toggleLayer = (name) =>
    setLayers((current) => ({
      ...current,
      [name]: !current[name],
    }));

  return (
    <Shell
      title="Map & Territories"
      subtitle="Geographic sales intelligence, coverage and pipeline concentration"
    >
      <div style={styles.page}>
        <div style={styles.toolbar}>
          <div>
            <div style={styles.eyebrow}>TERRITORY INTELLIGENCE</div>
            <div style={styles.toolbarTitle}>
              Live coverage from AI Sales companies and opportunities
            </div>
          </div>

          <div style={styles.toolbarActions}>
            <button style={styles.refresh} onClick={load} disabled={loading}>
              <RefreshCw size={15} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button style={styles.primaryButton} onClick={openCreate}>
              <Plus size={15} />
              New Territory
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.kpis}>
          <Metric icon={Route} label="Active Territories" value={number(summary.territories)} hint="Configured coverage" />
          <Metric icon={Building2} label="Companies" value={number(summary.companies)} hint="Discovered accounts" />
          <Metric icon={Users} label="Leads" value={number(summary.leads)} hint="Converted leads" />
          <Metric icon={CircleDollarSign} label="Pipeline" value={`SAR ${money(summary.pipeline_value)}`} hint={`Weighted SAR ${money(summary.weighted_value)}`} />
          <Metric icon={Signal} label="Signals" value={number(summary.signals)} hint="Buying signals" />
          <Metric icon={TrendingUp} label="Avg AI Score" value={`${number(summary.average_ai_score)}/100`} hint="Latest scoring" />
        </div>

        <div style={styles.mainGrid}>
          <section style={styles.mapCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderCopy}>
                <b>Sales Territory Map</b>
                <span>
                  {selected ? selected.name : "Select a territory"}
                </span>
              </div>
              <MapPin size={18} />
            </div>

            <div style={styles.mapFilterBar}>
              <div style={styles.searchWrap}>
                <Search size={14} />
                <input
                  style={styles.mapFilterInput}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company or city"
                />
              </div>

              <select
                style={styles.mapFilterSelect}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">All industries</option>
                {industries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <label style={styles.scoreFilter}>
                <span>AI Score ≥ {minScore}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                />
              </label>

              <label style={styles.signalFilter}>
                <input
                  type="checkbox"
                  checked={hasSignals}
                  onChange={(e) => setHasSignals(e.target.checked)}
                />
                Has signals
              </label>

              <button style={styles.miniButton} onClick={resetFilters}>
                Clear
              </button>
            </div>

            <div style={styles.layerBar}>
              <div style={styles.layerTitle}>
                <Layers3 size={14} />
                Layers
              </div>
              <LayerButton active={layers.companies} onClick={() => toggleLayer("companies")} label="Companies" />
              <LayerButton active={layers.leads} onClick={() => toggleLayer("leads")} label="Leads" />
              <LayerButton active={layers.opportunities} onClick={() => toggleLayer("opportunities")} label="Opportunities" />
              <LayerButton active={layers.signals} onClick={() => toggleLayer("signals")} label="Signals" />
              <LayerButton active={layers.pipeline} onClick={() => toggleLayer("pipeline")} label="Pipeline" />
              <div style={{ flex: 1 }} />
              <button style={styles.mapAction} onClick={fitTerritory}>
                <Crosshair size={13} />
                Fit Territory
              </button>
              <button style={styles.mapAction} onClick={resetView}>
                <RotateCcw size={13} />
                Reset View
              </button>
            </div>

            <div style={styles.realMapWrap}>
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={5}
                style={{ width: "100%", height: "100%" }}
                scrollWheelZoom
              >
                <MapController controllerRef={mapRef} />
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitCompanyMarkers
                  companies={visibleCompanies}
                  nonce={fitNonce}
                />

                {layers.pipeline &&
                  visibleCompanies
                    .filter((company) => Number(company.pipeline_value || 0) > 0)
                    .map((company) => (
                      <CircleMarker
                        key={`pipeline-${company.id}`}
                        center={[
                          company.displayLatitude,
                          company.displayLongitude,
                        ]}
                        radius={Math.min(
                          34,
                          10 + Math.log10(Number(company.pipeline_value) + 1) * 5
                        )}
                        pathOptions={{
                          color: "#f59e0b",
                          fillColor: "#f59e0b",
                          fillOpacity: 0.2,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <PopupContent company={company} onNavigate={onNavigate} />
                        </Popup>
                      </CircleMarker>
                    ))}

                {layers.leads &&
                  visibleCompanies
                    .filter((company) => Number(company.leads || 0) > 0)
                    .map((company) => (
                      <CircleMarker
                        key={`lead-${company.id}`}
                        center={[company.displayLatitude, company.displayLongitude]}
                        radius={8 + Math.min(10, Number(company.leads || 0) * 2)}
                        pathOptions={{
                          color: "#16a34a",
                          fillColor: "#16a34a",
                          fillOpacity: 0.62,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <PopupContent company={company} onNavigate={onNavigate} />
                        </Popup>
                      </CircleMarker>
                    ))}

                {layers.opportunities &&
                  visibleCompanies
                    .filter((company) => Number(company.opportunities || 0) > 0)
                    .map((company) => (
                      <CircleMarker
                        key={`opportunity-${company.id}`}
                        center={[company.displayLatitude, company.displayLongitude]}
                        radius={9 + Math.min(12, Number(company.opportunities || 0) * 2)}
                        pathOptions={{
                          color: "#ea580c",
                          fillColor: "#ea580c",
                          fillOpacity: 0.58,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <PopupContent company={company} onNavigate={onNavigate} />
                        </Popup>
                      </CircleMarker>
                    ))}

                {layers.signals &&
                  visibleCompanies
                    .filter((company) => Number(company.signals || 0) > 0)
                    .map((company) => (
                      <CircleMarker
                        key={`signal-${company.id}`}
                        center={[company.displayLatitude, company.displayLongitude]}
                        radius={7 + Math.min(10, Number(company.signals || 0) * 1.5)}
                        pathOptions={{
                          color: "#dc2626",
                          fillColor: "#dc2626",
                          fillOpacity: 0.55,
                          weight: 2,
                        }}
                      >
                        <Popup>
                          <PopupContent company={company} onNavigate={onNavigate} />
                        </Popup>
                      </CircleMarker>
                    ))}

                {layers.companies &&
                  visibleCompanies.map((company) => (
                    <Marker
                      key={`company-${company.id}`}
                      position={[
                        company.displayLatitude,
                        company.displayLongitude,
                      ]}
                      icon={companyIcon}
                    >
                      <Popup>
                        <PopupContent company={company} onNavigate={onNavigate} />
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>

              <div style={styles.realMapLegend}>
                <MapPin size={14} />
                <span>{selected?.name || "Territory"}</span>
                <b>{number(visibleCompanies.length)} visible</b>
                <span>•</span>
                <b>{number(mappedTotal)} mapped</b>
                <span>•</span>
                <b>{number(selected?.companies || 0)} total</b>
              </div>

              {!visibleCompanies.length && (
                <div style={styles.mapOverlayEmpty}>
                  <MapPin size={22} />
                  <b>No mapped companies match these filters.</b>
                  <span>Clear filters or geocode additional companies.</span>
                </div>
              )}
            </div>

            <div style={styles.legendStrip}>
              <LegendDot color={PURPLE} label="Company" />
              <LegendDot color="#16a34a" label="Lead" />
              <LegendDot color="#ea580c" label="Opportunity" />
              <LegendDot color="#dc2626" label="Signal" />
              <LegendDot color="#f59e0b" label="Pipeline concentration" />
              <span style={styles.legendNote}>
                Overlapping city-level coordinates are offset for display only.
              </span>
            </div>
          </section>

          <section style={styles.performanceCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderCopy}>
                <b>Territory Performance</b>
                <span>Click a territory to focus the map</span>
              </div>
              <Target size={18} />
            </div>

            <div style={styles.territoryList}>
              {territories.length ? (
                territories.map((territory) => (
                  <button
                    key={territory.id}
                    style={{
                      ...styles.territoryRow,
                      ...(selected?.id === territory.id
                        ? styles.territoryRowActive
                        : {}),
                    }}
                    onClick={() => {
                      setSelectedId(territory.id);
                      setFitNonce((value) => value + 1);
                    }}
                  >
                    <div style={styles.rowTop}>
                      <div style={{ minWidth: 0 }}>
                        <b style={styles.rowName}>{territory.name}</b>
                        <span style={styles.rowSub}>
                          {number(territory.companies)} companies
                          <span>•</span>
                          {number(territory.leads)} leads
                        </span>
                      </div>
                      <strong style={styles.rowPipeline}>
                        SAR {money(territory.pipeline_value)}
                      </strong>
                    </div>
                    <div style={styles.track}>
                      <span
                        style={{
                          ...styles.fill,
                          width: `${Math.max(
                            0,
                            Math.min(100, Number(territory.target_achievement || 0))
                          )}%`,
                        }}
                      />
                    </div>
                    <div style={styles.rowFooter}>
                      <span>
                        Target achievement{" "}
                        {territory.target_achievement == null
                          ? "—"
                          : `${territory.target_achievement}%`}
                      </span>
                      <span>AI {number(territory.average_ai_score)}/100</span>
                    </div>
                  </button>
                ))
              ) : (
                <Empty text="No active territories configured." />
              )}
            </div>
          </section>
        </div>

        {selected && (
          <>
            <div style={styles.detailGrid}>
              <Detail label="Companies" value={number(selected.companies)} />
              <Detail label="Leads" value={number(selected.leads)} />
              <Detail label="Opportunities" value={number(selected.opportunities)} />
              <Detail label="Pipeline" value={`SAR ${money(selected.pipeline_value)}`} />
              <Detail label="Weighted" value={`SAR ${money(selected.weighted_value)}`} />
              <Detail label="AI Score" value={`${number(selected.average_ai_score)}/100`} />
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
                          {number(city.companies)} companies
                          <span> • </span>
                          {number(city.leads)} leads
                          <span> • </span>
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
                        <small>{number(company.opportunities)} opps</small>
                        <small>SAR {money(company.pipeline_value)}</small>
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
                  Country: {selected.country || "Any"}
                  <span> • </span>
                  Region: {selected.region || "Any"}
                  <span> • </span>
                  Cities:{" "}
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
                  <Pencil size={13} />
                  Edit
                </button>
                <button
                  style={{ ...styles.inlineAction, ...styles.dangerAction }}
                  onClick={() => deactivateTerritory(selected)}
                >
                  <Power size={13} />
                  Deactivate
                </button>
              </div>
            </section>
          </>
        )}

        {editorOpen && (
          <div
            style={styles.modalBackdrop}
            onMouseDown={() => setEditorOpen(false)}
          >
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
                Companies are matched automatically using country, region, city
                and optional industry criteria. Leave a field empty when it
                should not restrict the territory.
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
                  {saving
                    ? "Saving..."
                    : editing
                    ? "Save Changes"
                    : "Create Territory"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Shell>
  );
}

function LayerButton({ active, onClick, label }) {
  return (
    <button
      style={{
        ...styles.layerButton,
        ...(active ? styles.layerButtonActive : {}),
      }}
      onClick={onClick}
      type="button"
    >
      <span
        style={{
          ...styles.layerIndicator,
          ...(active ? styles.layerIndicatorActive : {}),
        }}
      />
      {label}
    </button>
  );
}

function LegendDot({ color, label }) {
  return (
    <span style={styles.legendItem}>
      <i style={{ ...styles.legendDot, background: color }} />
      {label}
    </span>
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
  page: { display: "grid", gap: 14 },
  toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: PURPLE },
  toolbarTitle: { marginTop: 3, fontSize: 17, fontWeight: 800, color: "#18213a" },
  toolbarActions: { display: "flex", alignItems: "center", gap: 8 },
  primaryButton: { height: 38, padding: "0 14px", borderRadius: 9, border: `1px solid ${PURPLE}`, background: PURPLE, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", fontFamily: "inherit", fontWeight: 800 },
  refresh: { height: 38, padding: "0 14px", borderRadius: 9, border: "1px solid #dfe3ee", background: "#fff", color: "#344054", display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 },
  error: { padding: "11px 13px", borderRadius: 10, background: "#fff1f2", border: "1px solid #fecdd3", color: "#be123c", fontSize: 12 },
  kpis: { display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 },
  metric: { minWidth: 0, padding: 14, borderRadius: 14, border: "1px solid #e6e8f1", background: "#fff", display: "flex", gap: 10, alignItems: "flex-start" },
  metricIcon: { width: 34, height: 34, borderRadius: 10, background: "#f0edff", color: PURPLE, display: "grid", placeItems: "center", flex: "0 0 auto" },
  metricLabel: { display: "block", color: "#7c8498", fontSize: 10, textTransform: "uppercase" },
  metricValue: { display: "block", marginTop: 3, color: "#17213b", fontSize: 17 },
  metricHint: { display: "block", marginTop: 3, color: "#9aa1b2", fontSize: 9 },
  mainGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1.55fr) minmax(300px, .75fr)", gap: 12 },
  mapCard: { background: "#fff", border: "1px solid #e5e8f1", borderRadius: 15, overflow: "hidden" },
  performanceCard: { background: "#fff", border: "1px solid #e5e8f1", borderRadius: 15, overflow: "hidden" },
  cardHeader: { minHeight: 58, padding: "0 16px", borderBottom: "1px solid #edf0f5", display: "flex", alignItems: "center", justifyContent: "space-between", color: PURPLE },
  cardHeaderCopy: { display: "grid", gap: 4, minWidth: 0 },

  mapFilterBar: { padding: "10px 12px", borderBottom: "1px solid #eef0f5", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#fff" },
  searchWrap: { height: 34, minWidth: 220, padding: "0 10px", borderRadius: 8, border: "1px solid #dfe3eb", display: "flex", alignItems: "center", gap: 7, color: "#98a2b3" },
  mapFilterInput: { minWidth: 0, flex: 1, border: 0, outline: "none", fontFamily: "inherit", fontSize: 11 },
  mapFilterSelect: { height: 34, minWidth: 145, padding: "0 9px", borderRadius: 8, border: "1px solid #dfe3eb", background: "#fff", fontFamily: "inherit", fontSize: 11 },
  scoreFilter: { display: "flex", alignItems: "center", gap: 7, color: "#667085", fontSize: 10, fontWeight: 700 },
  signalFilter: { height: 34, padding: "0 9px", borderRadius: 8, border: "1px solid #e4e7ec", display: "inline-flex", alignItems: "center", gap: 6, color: "#667085", fontSize: 10, fontWeight: 700 },
  miniButton: { height: 34, padding: "0 10px", borderRadius: 8, border: "1px solid #e4e7ec", background: "#fff", color: "#667085", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700 },
  layerBar: { minHeight: 46, padding: "7px 12px", borderBottom: "1px solid #eef0f5", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", background: "#fafbff" },
  layerTitle: { display: "inline-flex", alignItems: "center", gap: 5, color: "#475467", fontSize: 10, fontWeight: 800, marginRight: 2 },
  layerButton: { height: 30, padding: "0 9px", borderRadius: 8, border: "1px solid #e2e5ec", background: "#fff", color: "#667085", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 700 },
  layerButtonActive: { borderColor: "#d8d2ff", background: "#f7f5ff", color: "#5547e8" },
  layerIndicator: { width: 7, height: 7, borderRadius: 999, background: "#cbd0da" },
  layerIndicatorActive: { background: PURPLE },
  mapAction: { height: 30, padding: "0 9px", borderRadius: 8, border: "1px solid #ddd9ff", background: "#fff", color: "#5d50dc", display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 10 },
  realMapWrap: { height: 460, position: "relative", overflow: "hidden" },
  realMapLegend: { position: "absolute", zIndex: 500, left: 14, bottom: 14, padding: "9px 11px", borderRadius: 10, background: "rgba(255,255,255,.95)", border: "1px solid #e6e8f1", boxShadow: "0 8px 24px rgba(16,24,40,.12)", display: "flex", alignItems: "center", gap: 7, color: PURPLE, fontSize: 10 },
  mapOverlayEmpty: { position: "absolute", zIndex: 600, left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 300, padding: 16, borderRadius: 14, background: "rgba(255,255,255,.94)", border: "1px solid #e6e8f1", boxShadow: "0 12px 30px rgba(16,24,40,.12)", display: "grid", gap: 6, placeItems: "center", textAlign: "center", color: "#667085" },
  legendStrip: { padding: "10px 12px", borderTop: "1px solid #eef0f5", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "#fff" },
  legendItem: { display: "inline-flex", alignItems: "center", gap: 5, color: "#667085", fontSize: 10, fontWeight: 700 },
  legendDot: { width: 8, height: 8, borderRadius: 999, display: "inline-block" },
  legendNote: { marginLeft: "auto", color: "#98a2b3", fontSize: 9 },
  territoryList: { padding: 10, display: "grid", gap: 7 },
  territoryRow: { width: "100%", border: "1px solid transparent", background: "#fff", borderRadius: 11, padding: 10, cursor: "pointer", textAlign: "left", fontFamily: "inherit" },
  territoryRowActive: { borderColor: "#ddd7ff", background: "#faf9ff" },
  rowTop: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" },
  rowName: { display: "block", color: "#17213b", fontSize: 12 },
  rowSub: { marginTop: 4, display: "flex", alignItems: "center", gap: 5, color: "#8b93a5", fontSize: 9 },
  rowPipeline: { color: "#5547e8", fontSize: 11, whiteSpace: "nowrap" },
  rowFooter: { marginTop: 6, display: "flex", justifyContent: "space-between", gap: 8, color: "#8b93a5", fontSize: 9 },
  track: { height: 5, marginTop: 9, background: "#eff1f6", borderRadius: 999, overflow: "hidden" },
  fill: { display: "block", height: "100%", background: PURPLE, borderRadius: 999 },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 },
  detail: { padding: "13px 14px", border: "1px solid #e6e8f1", borderRadius: 12, background: "#fff" },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  panel: { border: "1px solid #e6e8f1", borderRadius: 14, background: "#fff", padding: 14 },
  panelTitle: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 11, borderBottom: "1px solid #eef0f5", color: PURPLE },
  cityRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "11px 2px", borderBottom: "1px solid #f0f1f5" },
  companyRow: { width: "100%", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "11px 2px", border: 0, borderBottom: "1px solid #f0f1f5", background: "transparent", textAlign: "left", cursor: "pointer", fontFamily: "inherit" },
  companyMetrics: { display: "flex", gap: 8, alignItems: "center" },
  coveragePanel: { padding: 14, borderRadius: 14, border: "1px solid #ded9ff", background: "#faf9ff", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  coverageStats: { display: "flex", gap: 8, flexWrap: "wrap" },
  empty: { padding: "22px 4px", textAlign: "center", color: "#9299aa", fontSize: 12 },
  inlineAction: { height: 30, padding: "0 9px", borderRadius: 8, border: "1px solid #ddd9ff", background: "#fff", color: "#5d50dc", display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 11 },
  dangerAction: { borderColor: "#fecdd3", color: "#be123c" },
  popupGrid: { marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  popupStat: { padding: 7, borderRadius: 8, background: "#f8f9fc", display: "grid", gap: 2 },
  popupButton: { width: "100%", height: 32, marginTop: 10, borderRadius: 8, border: 0, background: PURPLE, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 10 },
  modalBackdrop: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(16,24,40,.36)", backdropFilter: "blur(2px)", display: "grid", placeItems: "center", padding: 20 },
  modal: { width: "min(720px, 96vw)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 18, border: "1px solid #e4e7ec", boxShadow: "0 24px 70px rgba(16,24,40,.18)" },
  modalHeader: { padding: "18px 20px", borderBottom: "1px solid #eef0f5", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { margin: "4px 0 0", color: "#17213b", fontSize: 20 },
  iconButton: { width: 34, height: 34, borderRadius: 9, border: "1px solid #e4e7ec", background: "#fff", color: "#667085", display: "grid", placeItems: "center", cursor: "pointer" },
  formGrid: { padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  field: { display: "grid", gap: 6, color: "#475467", fontSize: 11, fontWeight: 700 },
  fieldWide: { gridColumn: "1 / -1" },
  input: { width: "100%", boxSizing: "border-box", height: 40, padding: "0 11px", border: "1px solid #dfe3eb", borderRadius: 9, outline: "none", background: "#fff", color: "#17213b", fontFamily: "inherit" },
  formNote: { margin: "0 20px 18px", padding: 11, borderRadius: 10, background: "#f7f5ff", color: "#6257a8", fontSize: 11, lineHeight: 1.6 },
  modalFooter: { padding: "14px 20px", borderTop: "1px solid #eef0f5", display: "flex", justifyContent: "flex-end", gap: 8 },
  cancelButton: { height: 38, padding: "0 14px", borderRadius: 9, border: "1px solid #dfe3eb", background: "#fff", color: "#475467", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 },
};
