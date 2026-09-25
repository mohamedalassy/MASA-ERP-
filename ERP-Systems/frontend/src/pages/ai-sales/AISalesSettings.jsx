import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  PackageSearch,
  RefreshCw,
  Sparkles,
  BookOpenCheck,
} from "lucide-react";

import {
  Shell,
  Btn,
  Kpi,
  Panel,
  Score,
} from "./shared";

import {
  aiSalesRequest,
} from "./aiSalesApi";

export default function AISalesSettings({
  onNavigate,
  activeView = "ai-sales-settings",
}) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [syncResult, setSyncResult] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | Load Catalog Profiles
  |--------------------------------------------------------------------------
  */

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await aiSalesRequest(
        "/catalog-profiles"
      );

      /*
       * Supports:
       *
       * [
       *   {...}
       * ]
       *
       * or:
       *
       * {
       *   data: [...]
       * }
       */

      const rows = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setProfiles(rows);
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load ERP catalog profiles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  /*
  |--------------------------------------------------------------------------
  | Sync ERP Catalog
  |--------------------------------------------------------------------------
  */

  const syncCatalog = async () => {
    if (syncing) {
      return;
    }

    setSyncing(true);
    setError("");
    setSuccess("");
    setSyncResult(null);

    try {
      const response = await aiSalesRequest(
        "/catalog/sync",
        {
          method: "POST",
        }
      );

      const result =
        response?.result ??
        response?.data ??
        response ??
        {};

      setSyncResult(result);

      setSuccess(
        response?.message ||
          "ERP catalog synchronized successfully."
      );

      await loadCatalog();
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to synchronize ERP catalog."
      );
    } finally {
      setSyncing(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Catalog Statistics
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    const active = profiles.filter(
      (profile) =>
        profile?.is_active !== false &&
        profile?.is_active !== 0
    );

    const products = active.filter(
      (profile) =>
        String(profile?.type || "")
          .toLowerCase() === "product"
    );

    const services = active.filter(
      (profile) =>
        String(profile?.type || "")
          .toLowerCase() === "service"
    );

    const linkedProducts = active.filter(
      (profile) => profile?.product_id
    );

    return {
      total: active.length,
      products: products.length,
      services: services.length,
      linkedProducts: linkedProducts.length,
    };
  }, [profiles]);

  /*
  |--------------------------------------------------------------------------
  | Settings Sections
  |--------------------------------------------------------------------------
  */

  const settings = [
    [
      "الخدمات والقطاعات",
      "Define ERP offerings, services, solutions and target verticals.",
    ],
    [
      "نموذج تقييم الذكاء",
      "Control fit, intent, timing and confidence weights.",
    ],
    [
      "المناطق",
      "Regions, coverage rules and sales ownership.",
    ],
    [
      "مصادر الاكتشاف",
      "Public sources, connectors and verification rules.",
    ],
    [
      "حوكمة الاتصالات",
      "Approvals, opt-out and rate limits.",
    ],
    [
      "صلاحيات الفريق",
      "Control review, approval and outreach access.",
    ],
  ];

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="إعدادات المبيعات الذكية"
      subtitle="اضبط ذكاء الكتالوج والتقييم والاكتشاف والمناطق والحوكمة."
    >
    <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 16,
  }}
>
  <button
    type="button"
    onClick={() => onNavigate?.("ai-sales-playbooks")}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "10px 16px",
      border: 0,
      borderRadius: 10,
      background: "#6657F5",
      color: "#ffffff",
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: "0 5px 14px rgba(102,87,245,.18)",
    }}
  >
    <BookOpenCheck size={16} />
    Sales Playbooks
  </button>
</div>
      {/* ================================================================
          ERP CATALOG INTELLIGENCE
      ================================================================= */}

      <Panel
        title="ذكاء كتالوج ERP"
        subtitle="زامن منتجات ERP مع طبقة ذكاء المبيعات."
        action={
          <Btn
            onClick={syncCatalog}
            disabled={syncing}
          >
            <RefreshCw
              size={16}
              className={
                syncing
                  ? "ai-sales-spin"
                  : ""
              }
            />

            {syncing
              ? "جارٍ المزامنة..."
              : "مزامنة كتالوج ERP"}
          </Btn>
        }
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            padding: 16,
            border: "1px solid #e8e7f4",
            borderRadius: 16,
            background:
              "linear-gradient(135deg, rgba(102,87,245,.08), rgba(102,87,245,.02))",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "#6657F5",
              color: "#fff",
              flex: "0 0 auto",
            }}
          >
            <Sparkles size={20} />
          </div>

          <div>
            <strong
              style={{
                display: "block",
                marginBottom: 4,
              }}
            >
              Catalog → AI Sales Intelligence
            </strong>

            <span
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "#6b7280",
              }}
            >
              Active ERP products are converted into
              intelligence profiles containing product
              descriptions, keywords and buying signals.
              These profiles are used by discovery,
              company matching and tender intelligence.
            </span>
          </div>
        </div>

        {/* STATUS MESSAGES */}

        {error && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "12px 14px",
              marginBottom: 16,
              borderRadius: 12,
              background: "#fff4f4",
              border: "1px solid #ffd8d8",
              color: "#b42318",
            }}
          >
            <AlertCircle size={18} />

            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "12px 14px",
              marginBottom: 16,
              borderRadius: 12,
              background: "#f0fff7",
              border: "1px solid #c8f2d8",
              color: "#067647",
            }}
          >
            <CheckCircle2 size={18} />

            <span>{success}</span>
          </div>
        )}

        {/* KPI CARDS */}

        <div
          className="kpi-grid"
          style={{
            marginBottom: 18,
          }}
        >
          <Kpi
            label="ملفات الكتالوج"
            value={
              loading
                ? "..."
                : stats.total
            }
            icon={Database}
          />

          <Kpi
            label="ملفات المنتجات"
            value={
              loading
                ? "..."
                : stats.products
            }
            icon={PackageSearch}
          />

          <Kpi
            label="منتجات ERP المرتبطة"
            value={
              loading
                ? "..."
                : stats.linkedProducts
            }
            icon={RefreshCw}
          />

          <Kpi
            label="ملفات الخدمات"
            value={
              loading
                ? "..."
                : stats.services
            }
            icon={Sparkles}
          />
        </div>

        {/* SYNC RESULT */}

        {syncResult && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
              marginBottom: 18,
            }}
          >
            <SyncMetric
              label="المنتجات المفحوصة"
              value={
                syncResult?.products_scanned ?? 0
              }
            />

            <SyncMetric
              label="ملفات تم إنشاؤها"
              value={
                syncResult?.profiles_created ?? 0
              }
            />

            <SyncMetric
              label="ملفات تم تحديثها"
              value={
                syncResult?.profiles_updated ?? 0
              }
            />

            <SyncMetric
              label="إجمالي الملفات"
              value={
                syncResult?.total_profiles ??
                stats.total
              }
            />
          </div>
        )}

        {/* PROFILE TABLE */}

        <div
          style={{
            border: "1px solid #ececf2",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #ececf2",
            }}
          >
            <div>
              <strong>
                Intelligence Profiles
              </strong>

              <div
                style={{
                  fontSize: 12,
                  color: "#8a8f98",
                  marginTop: 3,
                }}
              >
                Products and services available to
                AI Sales matching engines.
              </div>
            </div>

            <Btn
              secondary
              onClick={loadCatalog}
              disabled={loading}
            >
              <RefreshCw size={15} />

              {loading
                ? "جارٍ التحميل..."
                : "تحديث"}
            </Btn>
          </div>

          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "#8a8f98",
              }}
            >
              Loading catalog intelligence...
            </div>
          ) : profiles.length === 0 ? (
            <div
              style={{
                padding: 36,
                textAlign: "center",
              }}
            >
              <PackageSearch
                size={34}
                style={{
                  marginBottom: 10,
                  opacity: 0.5,
                }}
              />

              <strong
                style={{
                  display: "block",
                  marginBottom: 5,
                }}
              >
                No catalog profiles yet
              </strong>

              <span
                style={{
                  fontSize: 13,
                  color: "#8a8f98",
                }}
              >
                Click Sync ERP Catalog to build AI
                profiles from active ERP products.
              </span>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#fafafd",
                      textAlign: "left",
                    }}
                  >
                    <Th>الملف</Th>
                    <Th>النوع</Th>
                    <Th>ربط ERP</Th>
                    <Th>الكلمات المفتاحية</Th>
                    <Th>الحالة</Th>
                  </tr>
                </thead>

                <tbody>
                  {profiles.map(
                    (profile) => {
                      const keywords =
                        Array.isArray(
                          profile?.keywords
                        )
                          ? profile.keywords
                          : [];

                      return (
                        <tr
                          key={profile.id}
                          style={{
                            borderTop:
                              "1px solid #f0f0f5",
                          }}
                        >
                          <Td>
                            <div
                              style={{
                                fontWeight: 700,
                              }}
                            >
                              {profile.name ||
                                "ملف بدون اسم"}
                            </div>

                            {profile.description && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color:
                                    "#8a8f98",
                                  marginTop: 3,
                                  maxWidth: 360,
                                  whiteSpace:
                                    "nowrap",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                }}
                              >
                                {
                                  profile.description
                                }
                              </div>
                            )}
                          </Td>

                          <Td>
                            <Badge>
                              {String(
                                profile.type ||
                                  "profile"
                              ).toUpperCase()}
                            </Badge>
                          </Td>

                          <Td>
                            {profile.product_id ? (
                              <span
                                style={{
                                  color:
                                    "#067647",
                                  fontWeight: 700,
                                  fontSize: 12,
                                }}
                              >
                                ERP Product #
                                {
                                  profile.product_id
                                }
                              </span>
                            ) : (
                              <span
                                style={{
                                  color:
                                    "#8a8f98",
                                  fontSize: 12,
                                }}
                              >
                                Manual Profile
                              </span>
                            )}
                          </Td>

                          <Td>
                            <div
                              style={{
                                display: "flex",
                                gap: 5,
                                flexWrap: "wrap",
                                maxWidth: 380,
                              }}
                            >
                              {keywords
                                .slice(0, 5)
                                .map(
                                  (
                                    keyword,
                                    index
                                  ) => (
                                    <Keyword
                                      key={`${profile.id}-${index}`}
                                    >
                                      {
                                        keyword
                                      }
                                    </Keyword>
                                  )
                                )}

                              {keywords.length >
                                5 && (
                                <span
                                  style={{
                                    fontSize:
                                      11,
                                    color:
                                      "#8a8f98",
                                  }}
                                >
                                  +
                                  {keywords.length -
                                    5}
                                </span>
                              )}
                            </div>
                          </Td>

                          <Td>
                            <span
                              style={{
                                color:
                                  profile.is_active
                                    ? "#067647"
                                    : "#8a8f98",
                                fontWeight: 700,
                                fontSize: 12,
                              }}
                            >
                              {profile.is_active
                                ? "نشط"
                                : "غير نشط"}
                            </span>
                          </Td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>

      {/* ================================================================
          EXISTING SETTINGS
      ================================================================= */}

      <div
        className="settings-grid"
        style={{
          marginTop: 20,
        }}
      >
        {settings.map(
          (item, index) => (
            <article key={item[0]}>
              <span>
                0{index + 1}
              </span>

              <div>
                <h3>
                  {item[0]}
                </h3>

                <p>
                  {item[1]}
                </p>
              </div>

              <Btn secondary>
                Configure
              </Btn>
            </article>
          )
        )}
      </div>

      <style>{`
        @keyframes aiSalesSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .ai-sales-spin {
          animation: aiSalesSpin .8s linear infinite;
        }
      `}</style>
    </Shell>
  );
}

/*
|--------------------------------------------------------------------------
| Small UI Helpers
|--------------------------------------------------------------------------
*/

function SyncMetric({
  label,
  value,
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        border:
          "1px solid #ececf2",
        background: "#fff",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform:
            "uppercase",
          letterSpacing: ".05em",
          color: "#8a8f98",
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <strong
        style={{
          fontSize: 20,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function Th({
  children,
}) {
  return (
    <th
      style={{
        padding:
          "11px 14px",
        fontSize: 11,
        color: "#727782",
        textTransform:
          "uppercase",
        letterSpacing:
          ".04em",
        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
}) {
  return (
    <td
      style={{
        padding:
          "13px 14px",
        verticalAlign:
          "middle",
      }}
    >
      {children}
    </td>
  );
}

function Badge({
  children,
}) {
  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        padding:
          "4px 8px",
        borderRadius:
          999,
        background:
          "rgba(102,87,245,.10)",
        color:
          "#6657F5",
        fontSize:
          11,
        fontWeight:
          800,
      }}
    >
      {children}
    </span>
  );
}

function Keyword({
  children,
}) {
  return (
    <span
      style={{
        padding:
          "3px 7px",
        borderRadius:
          7,
        background:
          "#f5f4ff",
        color:
          "#6657F5",
        fontSize:
          10,
        fontWeight:
          700,
      }}
    >
      {children}
    </span>
  );
}