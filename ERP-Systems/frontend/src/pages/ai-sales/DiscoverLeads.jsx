import { useEffect, useMemo, useState } from "react";
import { Shell, Btn, Panel, uiIcons } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

const REGIONS = [
  "المنطقة الشرقية",
  "الرياض",
  "مكة المكرمة",
  "المدينة المنورة",
  "القصيم",
  "عسير",
  "تبوك",
  "حائل",
  "الحدود الشمالية",
  "جازان",
  "نجران",
  "الباحة",
  "الجوف",
];

const SIGNALS = [
  { id: "new_business", label: "نشاط جديد" },
  { id: "expansion", label: "توسع" },
  { id: "new_branch", label: "فرع جديد" },
  { id: "hiring", label: "توظيف" },
  { id: "projects", label: "مشاريع" },
  { id: "funding", label: "تمويل" },
  { id: "tender", label: "المنافسات" },
  { id: "procurement", label: "مشتريات" },
];

export default function DiscoverLeads({
  onNavigate,
  activeView = "ai-sales-discover",
}) {
  const [showAddTarget, setShowAddTarget] = useState(false);

  const [newTarget, setNewTarget] = useState({
    name: "",
    type: "service",
    description: "",
    keywords: "",
  });

  const [profiles, setProfiles] = useState([]);
  const [selectedProfiles, setSelectedProfiles] = useState([]);

  const [selectedSignals, setSelectedSignals] = useState([
    "new_business",
    "expansion",
  ]);

  const [region, setRegion] = useState("المنطقة الشرقية");

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogSyncing, setCatalogSyncing] = useState(false);
  const [discovering, setDiscovering] = useState(false);

  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Create Manual Sales Target
  |--------------------------------------------------------------------------
  */

  async function createTarget() {
    const name = newTarget.name.trim();

    if (!name) {
      setError("أدخل اسم الهدف.");
      return;
    }

    setError("");

    try {
      const created = await aiSalesRequest("/catalog-profiles", {
        method: "POST",

        body: JSON.stringify({
          name,
          type: newTarget.type,

          description:
            newTarget.description.trim() || null,

          keywords: newTarget.keywords
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),

          is_active: true,
        }),
      });

      setNewTarget({
        name: "",
        type: "service",
        description: "",
        keywords: "",
      });

      setShowAddTarget(false);

      await loadCatalog();

      if (created?.id) {
        setSelectedProfiles((current) => [
          ...new Set([
            ...current,
            Number(created.id),
          ]),
        ]);
      }
    } catch (err) {
      console.error(
        "Failed to create AI Sales target:",
        err
      );

      setError(
        err.message ||
          "تعذر إنشاء ملف الهدف."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load AI Sales Catalog
  |--------------------------------------------------------------------------
  */

  async function loadCatalog() {
    setCatalogLoading(true);
    setError("");

    try {
      const data = await aiSalesRequest(
        "/catalog-profiles"
      );

      const items = Array.isArray(data)
        ? data
        : data?.data || [];

      setProfiles(items);

      setSelectedProfiles((current) => {
        const availableIds = items.map((item) =>
          Number(item.id)
        );

        const validCurrent = current.filter((id) =>
          availableIds.includes(Number(id))
        );

        if (validCurrent.length) {
          return validCurrent;
        }

        return availableIds.slice(
          0,
          Math.min(3, availableIds.length)
        );
      });
    } catch (err) {
      console.error(
        "Failed to load AI Sales catalog:",
        err
      );

      setError(
        err.message ||
          "تعذر تحميل كتالوج المبيعات الذكية."
      );
    } finally {
      setCatalogLoading(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Sync ERP Catalog
  |--------------------------------------------------------------------------
  */

  async function syncCatalog() {
    setCatalogSyncing(true);
    setError("");

    try {
      await aiSalesRequest("/catalog/sync", {
        method: "POST",
      });

      await loadCatalog();
    } catch (err) {
      console.error(
        "Failed to sync ERP catalog:",
        err
      );

      setError(
        err.message ||
          "تعذرت مزامنة كتالوج ERP."
      );
    } finally {
      setCatalogSyncing(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Toggle Target
  |--------------------------------------------------------------------------
  */

  function toggleProfile(id) {
    const numericId = Number(id);

    setSelectedProfiles((current) =>
      current.includes(numericId)
        ? current.filter(
            (item) => item !== numericId
          )
        : [...current, numericId]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Toggle Signal
  |--------------------------------------------------------------------------
  */

  function toggleSignal(id) {
    setSelectedSignals((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Start Discovery
  |--------------------------------------------------------------------------
  */

  async function startDiscovery() {
    if (!selectedProfiles.length) {
      setError(
        "اختر منتجًا أو خدمة واحدة على الأقل قبل بدء الاكتشاف."
      );

      return;
    }

    if (!region) {
      setError("اختر المنطقة المستهدفة.");
      return;
    }

    setDiscovering(true);
    setError("");
    setResult(null);

    try {
      const data = await aiSalesRequest(
        "/discovery/run",
        {
          method: "POST",

          body: JSON.stringify({
            catalog_profile_ids:
              selectedProfiles,

            country: "المملكة العربية السعودية",

            region,

            signals: selectedSignals,
          }),
        }
      );

      const discoveryResult =
        data?.run ?? data?.data ?? data;

      setResult(discoveryResult);

      setTimeout(() => {
        onNavigate?.("ai-sales-discovered");
      }, 900);
    } catch (err) {
      console.error(
        "AI Discovery failed:",
        err
      );

      setError(
        err.message ||
          "تعذر إكمال الاكتشاف بالذكاء الاصطناعي."
      );
    } finally {
      setDiscovering(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Selected Target Objects
  |--------------------------------------------------------------------------
  */

  const selectedProfileObjects = useMemo(
    () =>
      profiles.filter((profile) =>
        selectedProfiles.includes(
          Number(profile.id)
        )
      ),
    [profiles, selectedProfiles]
  );

  /*
  |--------------------------------------------------------------------------
  | Discovery Result Counts
  |--------------------------------------------------------------------------
  */

  const foundCount =
    result?.found_count ??
    result?.total_count ??
    result?.accepted_count ??
    0;

  const acceptedCount =
    result?.accepted_count ??
    result?.accepted ??
    0;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="اكتشاف عملاء محتملين جدد"
      subtitle="حدد سوقك المستهدف بدقة ودع الذكاء الاصطناعي يكشف الشركات ذات إشارات الشراء الحقيقية."
    >
      <div className="workspace-2">
        {/* =====================================================
            DISCOVERY CONFIGURATION
        ===================================================== */}

        <Panel
          title="إعدادات الاكتشاف"
          action={
            <button
              type="button"
              onClick={syncCatalog}
              disabled={
                catalogSyncing || discovering
              }
              style={{
                border: 0,
                background: "transparent",

                cursor:
                  catalogSyncing || discovering
                    ? "not-allowed"
                    : "pointer",

                fontWeight: 700,
              }}
            >
              {catalogSyncing
                ? "جارٍ المزامنة..."
                : "مزامنة كتالوج ERP"}
            </button>
          }
        >
          <div className="pro-form">
            {/* =============================================
                Products / Services
            ============================================= */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: 12,
              }}
            >
              <label style={{ margin: 0 }}>
                Target Products & Services
              </label>

              <button
                type="button"
                onClick={() =>
                  setShowAddTarget(true)
                }
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#6657F5",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                + Add Target
              </button>
            </div>

            {catalogLoading ? (
              <div
                style={{
                  padding: "18px 0",
                  opacity: 0.7,
                }}
              >
                Loading ERP catalog...
              </div>
            ) : profiles.length ? (
              <div className="select-cards">
                {profiles.map((profile) => {
                  const selected =
                    selectedProfiles.includes(
                      Number(profile.id)
                    );

                  return (
                    <button
                      type="button"
                      key={profile.id}
                      className={
                        selected
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        toggleProfile(
                          profile.id
                        )
                      }
                      disabled={discovering}
                    >
                      {profile.name}

                      <small
                        style={{
                          display: "block",
                          marginTop: 3,
                          opacity: 0.65,
                          fontSize: 9,
                          textTransform:
                            "uppercase",
                        }}
                      >
                        {profile.type}
                      </small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: 16,

                  border:
                    "1px dashed #d7d7e0",

                  borderRadius: 12,
                }}
              >
                <strong>
                  No sales targets configured
                  yet.
                </strong>

                <div
                  style={{
                    marginTop: 6,
                    opacity: 0.7,
                  }}
                >
                  Sync ERP products or add a
                  service, solution,
                  subscription or project
                  manually.
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowAddTarget(true)
                  }
                  style={{
                    marginTop: 12,
                    border: 0,
                    borderRadius: 9,
                    background: "#6657F5",
                    color: "#fff",
                    padding: "9px 14px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  + Add First Target
                </button>
              </div>
            )}

            {/* =============================================
                Add Target
            ============================================= */}

            {showAddTarget && (
              <div
                style={{
                  border:
                    "1px solid #ddd9ff",

                  background: "#faf9ff",

                  borderRadius: 14,

                  padding: 16,

                  display: "grid",

                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems: "center",
                  }}
                >
                  <strong>
                    Add Sales Target
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAddTarget(false)
                    }
                    style={{
                      border: 0,

                      background:
                        "transparent",

                      cursor: "pointer",

                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="اسم الهدف"
                  value={newTarget.name}
                  onChange={(e) =>
                    setNewTarget(
                      (current) => ({
                        ...current,
                        name: e.target.value,
                      })
                    )
                  }
                />

                <select
                  value={newTarget.type}
                  onChange={(e) =>
                    setNewTarget(
                      (current) => ({
                        ...current,
                        type: e.target.value,
                      })
                    )
                  }
                >
                  <option value="product">
                    Product
                  </option>

                  <option value="service">
                    Service
                  </option>

                  <option value="subscription">
                    Subscription
                  </option>

                  <option value="project">
                    Project
                  </option>

                  <option value="solution">
                    Solution
                  </option>
                </select>

                <textarea
                  placeholder="ما الذي يقدمه هذا المنتج أو الخدمة؟"
                  value={
                    newTarget.description
                  }
                  onChange={(e) =>
                    setNewTarget(
                      (current) => ({
                        ...current,

                        description:
                          e.target.value,
                      })
                    )
                  }
                  rows={3}
                />

                <input
                  type="text"
                  placeholder="الكلمات المفتاحية مفصولة بفواصل"
                  value={newTarget.keywords}
                  onChange={(e) =>
                    setNewTarget(
                      (current) => ({
                        ...current,

                        keywords:
                          e.target.value,
                      })
                    )
                  }
                />

                <button
                  type="button"
                  onClick={createTarget}
                  style={{
                    border: 0,
                    borderRadius: 10,
                    background: "#6657F5",
                    color: "#fff",
                    padding: "11px 14px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  Create Target
                </button>
              </div>
            )}

            {/* =============================================
                Region
            ============================================= */}

            <select
              value={region}
              onChange={(e) =>
                setRegion(e.target.value)
              }
              disabled={discovering}
            >
              {REGIONS.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            {/* =============================================
                Signals
            ============================================= */}

            <label>Company Signals</label>

            <div className="select-cards">
              {SIGNALS.map((signal) => (
                <button
                  type="button"
                  key={signal.id}
                  className={
                    selectedSignals.includes(
                      signal.id
                    )
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    toggleSignal(signal.id)
                  }
                  disabled={discovering}
                >
                  {signal.label}
                </button>
              ))}
            </div>

            {/* =============================================
                Error
            ============================================= */}

            {error && (
              <div
                style={{
                  padding: "12px 14px",

                  borderRadius: 10,

                  background: "#fff3f3",

                  border:
                    "1px solid #ffd1d1",

                  color: "#b42318",

                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {/* =============================================
                Result
            ============================================= */}

            {result && (
              <div
                style={{
                  padding: "12px 14px",

                  borderRadius: 10,

                  background: "#f2fbf6",

                  border:
                    "1px solid #ccebd9",

                  fontSize: 13,
                }}
              >
                Discovery completed —{" "}

                <strong>
                  {foundCount}
                </strong>{" "}

                companies found,{" "}

                <strong>
                  {acceptedCount}
                </strong>{" "}

                accepted.
              </div>
            )}

            {/* =============================================
                Start Discovery
            ============================================= */}

            <Btn
              onClick={startDiscovery}
              disabled={
                discovering ||
                catalogLoading ||
                !selectedProfiles.length
              }
            >
              {discovering
                ? "الذكاء الاصطناعي يفحص السوق..."
                : "بدء الاكتشاف بالذكاء الاصطناعي ←"}
            </Btn>
          </div>
        </Panel>

        {/* =====================================================
            AI DISCOVERY AGENT
        ===================================================== */}

        <div className="agent-card">
          <div className="agent-orb">
            <uiIcons.Sparkles size={35} />
          </div>

          <small>
            DISCOVERY AGENT
          </small>

          <h2>
            {discovering
              ? "جارٍ فحص السوق..."
              : "جاهز لفحص السوق"}
          </h2>

          <p>
            AI uses your ERP catalog and sales
            settings to find, enrich, verify
            and score relevant accounts before
            they reach your team.
          </p>

          <div className="agent-stats">
            <span>
              <b>
                {
                  selectedProfileObjects.length
                }
              </b>

              Targets
            </span>

            <span>
              <b>
                {selectedSignals.length}
              </b>

              Signals
            </span>

            <span>
              <b>{profiles.length}</b>

              Catalog
            </span>
          </div>

          {discovering && (
            <div
              style={{
                marginTop: 20,

                padding: 14,

                borderRadius: 12,

                background:
                  "rgba(255,255,255,.08)",
              }}
            >
              Discovering companies in{" "}

              <strong>{region}</strong>

              ...
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}