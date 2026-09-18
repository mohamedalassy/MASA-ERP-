import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Calculator,
  CheckCircle2,
  FilePlus2,
  FileText,
  History,
  Package,
  Percent,
  Scale,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export default function PricingDashboard({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvalBusyId, setApprovalBusyId] = useState(null);
  const [approvalMessage, setApprovalMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPricingData() {
      try {
        const productResponse = await fetch(`${API_URL}/products`, {
          headers: { Accept: "application/json" },
        });

        const quotationResponse = await fetch(`${API_URL}/quotations`, {
          headers: { Accept: "application/json" },
        });

        const productResult = await productResponse.json();
        const quotationResult = await quotationResponse.json();

        if (cancelled) return;

        setProducts(
          Array.isArray(productResult?.data)
            ? productResult.data
            : []
        );

        setQuotations(
          Array.isArray(quotationResult?.data)
            ? quotationResult.data
            : []
        );
      } catch (error) {
        console.error("Pricing dashboard:", error);

        if (!cancelled) {
          setProducts([]);
          setQuotations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPricingData();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const approved = quotations.filter(
      (item) => item.status === "approved"
    );

    const totalValue = quotations.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const approvedValue = approved.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    const productMargins = products
      .map((product) => {
        const cost = Number(product.cost_price || 0);
        const sale = Number(
          product.default_sale_price || 0
        );

        if (sale <= 0) return 0;

        return ((sale - cost) / sale) * 100;
      })
      .filter((value) => value > 0);

    const averageMargin = productMargins.length
      ? productMargins.reduce(
          (sum, value) => sum + value,
          0
        ) / productMargins.length
      : 0;

    return {
      totalQuotations: quotations.length,
      totalValue,
      approvedCount: approved.length,
      approvedValue,
      averageMargin,
    };
  }, [products, quotations]);

  const topProducts = useMemo(() => {
    return products
      .map((product) => {
        const cost = Number(product.cost_price || 0);
        const sale = Number(
          product.default_sale_price || 0
        );

        const margin =
          sale > 0 ? ((sale - cost) / sale) * 100 : 0;

        return {
          ...product,
          margin,
        };
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 4);
  }, [products]);

  const draftQuotations = quotations
    .filter((quotation) => quotation.status === "draft")
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  const pendingApprovalQuotations = quotations
    .filter((quotation) => quotation.status === "pending_approval")
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));

  const recentQuotations = [
    ...draftQuotations,
    ...quotations.filter((quotation) => quotation.status !== "draft"),
  ].slice(0, 6);

  const updateQuotationLocally = (updated) => {
    if (!updated?.id) return;

    setQuotations((current) =>
      current.map((row) =>
        Number(row.id) === Number(updated.id)
          ? {
              ...row,
              ...updated,
            }
          : row
      )
    );
  };

  const approveQuotation = async (quotation) => {
    const projectId =
      quotation.project_id || quotation.project?.id;

    if (!projectId) {
      setApprovalMessage("تعذر تحديد المشروع المرتبط بعرض السعر.");
      return;
    }

    setApprovalBusyId(quotation.id);
    setApprovalMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/projects/${projectId}/quotations/${quotation.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "تعذر اعتماد عرض السعر.");
      }

      updateQuotationLocally(json?.data);

      /*
       * بعد اعتماد أحدث عرض سعر، ننقل المشروع باستخدام
       * Workflow المشروع نفسه بدل تكرار منطق المراحل هنا.
       */
      const moveResponse = await fetch(
        `http://127.0.0.1:8000/api/projects/${projectId}/next-stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            notes: `تم اعتماد عرض السعر ${
              json?.data?.quotation_number || `#${quotation.id}`
            } وتحويل المشروع تلقائيًا من مركز التسعير.`,
          }),
        }
      );

      const moveJson = await moveResponse.json();

      if (!moveResponse.ok) {
        setApprovalMessage(
          `${json?.message || "تم اعتماد عرض السعر بنجاح."} لكن تعذر نقل المشروع تلقائيًا: ${
            moveJson?.message || "راجع Workflow المشروع."
          }`
        );
        return;
      }

      const stageNames = {
        crm: "CRM",
        sales: "المبيعات",
        pricing: "التسعير",
        purchasing: "المشتريات",
        finance: "المالية",
        execution: "التنفيذ",
        closed: "الإغلاق",
      };

      const nextStage = moveJson?.data?.current_stage;

      setApprovalMessage(
        `تم اعتماد ${
          json?.data?.quotation_number || "عرض السعر"
        } ونقل المشروع تلقائيًا إلى ${
          stageNames[nextStage] || nextStage || "المرحلة التالية"
        }.`
      );
    } catch (error) {
      console.error("Approve quotation error:", error);
      setApprovalMessage(
        error.message || "تعذر اعتماد عرض السعر."
      );
    } finally {
      setApprovalBusyId(null);
    }
  };

  const requestQuotationChanges = async (quotation) => {
    const projectId =
      quotation.project_id || quotation.project?.id;

    if (!projectId) {
      setApprovalMessage("تعذر تحديد المشروع المرتبط بعرض السعر.");
      return;
    }

    const reason =
      window.prompt(
        "اكتب ملاحظة التعديل المطلوبة (اختياري):",
        "يرجى مراجعة الأسعار والبنود قبل الاعتماد."
      ) ?? null;

    if (reason === null) return;

    setApprovalBusyId(quotation.id);
    setApprovalMessage("");

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/api/projects/${projectId}/quotations/${quotation.id}/request-changes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(
          json?.message || "تعذر إرجاع عرض السعر للتعديل."
        );
      }

      updateQuotationLocally(json?.data);
      setApprovalMessage(
        json?.message || "تم إرجاع العرض للتعديل."
      );
    } catch (error) {
      console.error("Request quotation changes error:", error);
      setApprovalMessage(
        error.message || "تعذر إرجاع عرض السعر للتعديل."
      );
    } finally {
      setApprovalBusyId(null);
    }
  };

  const openQuotation = (quotation) => {
    if (quotation.status === "draft") {
      onNavigate?.("pricing-builder", {
        projectId: quotation.project_id || quotation.project?.id,
        quotationId: quotation.id,
      });
      return;
    }

    onNavigate?.("quotations");
  };

  const go = (view) => {
    if (
      view === "price-list" ||
      view === "quotations" ||
      view === "pricing-builder" ||
      view === "pricing-suppliers" ||
      view === "pricing-history" ||
      view === "pricing-rules" ||
      view === "pricing-calculator" ||
      view === "pricing-packages"
      || view === "pricing-alternatives"
      || view === "pricing-costing"
      || view === "pricing-reports"
    ) {
      onNavigate?.(view);
      return;
    }

    window.alert(
      "تم تجهيز مكان هذه الوحدة داخل مركز التسعير، وسنبني تفاصيلها في الخطوة التالية."
    );
  };

  const quickActions = [
    {
      label: "عرض سعر جديد",
      icon: FilePlus2,
      view: "pricing-builder",
      tone: "purple",
    },
    {
      label: "BOQ Builder",
      icon: Boxes,
      view: "pricing-builder",
      tone: "blue",
    },
    {
      label: "باقات المنتجات",
      icon: Package,
      view: "pricing-packages",
      tone: "violet",
    },
    {
      label: "قواعد الربح والخصومات",
      icon: Percent,
      view: "pricing-rules",
      tone: "orange",
    },
    {
      label: "سعر مقترح",
      icon: Sparkles,
      view: "pricing-calculator",
      tone: "amber",
    },
    {
      label: "سجل أسعار المنتجات",
      icon: History,
      view: "pricing-history",
      tone: "purple",
    },
    {
      label: "مقارنة الموردين",
      icon: Scale,
      view: "pricing-suppliers",
      tone: "cyan",
    },
    {
      label: "حساب تكلفة المشروع",
      icon: Calculator,
      view: "pricing-costing",
      tone: "blue",
    },
  ];

  return (
    <section className="pricing-dashboard-page" dir="rtl">
      <style>{`
        .pricing-dashboard-page {
          color: #252b3d;
          font-family: inherit;
          padding-bottom: 28px;
        }

        .pricing-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 18px;
        }

        .pricing-kicker {
          color: #6b5bf5;
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 5px;
        }

        .pricing-head h1 {
          margin: 0;
          font-size: 28px;
          color: #17213a;
        }

        .pricing-head p {
          margin: 6px 0 0;
          color: #989faf;
          font-size: 11px;
        }

        .pricing-back {
          background: #fff;
          border: 1px solid #e5e8ef;
          border-radius: 11px;
          padding: 10px 14px;
          font-family: inherit;
          cursor: pointer;
        }

        .pricing-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 13px;
        }

        .pricing-card {
          background: #fff;
          border: 1px solid #e9ebf2;
          border-radius: 16px;
          box-shadow: 0 8px 30px rgba(32, 41, 70, 0.035);
        }

        .pricing-stat {
          padding: 16px;
        }

        .pricing-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .pricing-stat-label {
          font-size: 10px;
          color: #818899;
          font-weight: 700;
        }

        .pricing-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: grid;
          place-items: center;
        }

        .pricing-icon.purple {
          background: #f0edff;
          color: #6557f5;
        }

        .pricing-icon.blue {
          background: #edf3ff;
          color: #4e7eff;
        }

        .pricing-icon.green {
          background: #eaf9f3;
          color: #18a777;
        }

        .pricing-icon.orange {
          background: #fff3e6;
          color: #f59b2c;
        }

        .pricing-icon.cyan {
          background: #eafafa;
          color: #19aeb7;
        }

        .pricing-icon.violet {
          background: #f3efff;
          color: #8a64f7;
        }

        .pricing-icon.amber {
          background: #fff7e9;
          color: #e9a12d;
        }

        .pricing-stat-value {
          margin-top: 10px;
          font-size: 21px;
          font-weight: 900;
          color: #192238;
        }

        .pricing-stat-sub {
          margin-top: 4px;
          font-size: 9px;
          color: #9da3b1;
        }

        .pricing-actions {
          padding: 15px;
          margin-bottom: 13px;
        }

        .pricing-title {
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        .pricing-action-grid {
          display: grid;
          grid-template-columns: repeat(8, minmax(0, 1fr));
          gap: 9px;
        }

        .pricing-action {
          min-height: 88px;
          border: 1px solid #e8ebf2;
          border-radius: 13px;
          background: #fff;
          font-family: inherit;
          cursor: pointer;
          padding: 11px 7px;
        }

        .pricing-action:hover {
          border-color: #d2ccff;
          transform: translateY(-1px);
        }

        .pricing-action .pricing-icon {
          margin: 0 auto 8px;
          width: 36px;
          height: 36px;
        }

        .pricing-action strong {
          display: block;
          font-size: 9px;
          color: #333b50;
        }

        .pricing-main-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.95fr 0.8fr;
          gap: 12px;
          margin-bottom: 13px;
        }

        .pricing-panel {
          padding: 16px;
          min-height: 270px;
        }

        .pricing-chart {
          height: 190px;
          display: flex;
          align-items: end;
          justify-content: space-around;
          gap: 12px;
          padding: 10px 10px 0;
          border-bottom: 1px solid #edf0f5;
        }

        .pricing-bar-pair {
          flex: 1;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: end;
          gap: 4px;
        }

        .pricing-bar {
          width: 11px;
          border-radius: 6px 6px 2px 2px;
          background: #6c5df6;
        }

        .pricing-bar.orange {
          background: #f4a23b;
        }

        .pricing-months {
          display: flex;
          justify-content: space-around;
          font-size: 8px;
          color: #a0a6b3;
          padding-top: 7px;
        }

        .pricing-status-list,
        .pricing-profit-list {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .pricing-status-row,
        .pricing-profit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 9px 0;
          border-bottom: 1px solid #f0f2f5;
          font-size: 10px;
        }

        .pricing-status-row:last-child,
        .pricing-profit-row:last-child {
          border-bottom: 0;
        }

        .pricing-status-name {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .pricing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .pricing-profit-row strong {
          font-size: 10px;
        }

        .pricing-profit-row span {
          color: #18a777;
          font-size: 11px;
          font-weight: 900;
        }

        .pricing-bottom {
          display: grid;
          grid-template-columns: 1.55fr 0.55fr;
          gap: 12px;
          margin-bottom: 13px;
        }

        .pricing-table-card {
          overflow: hidden;
        }

        .pricing-table-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
        }

        .pricing-table-head button {
          border: 0;
          background: transparent;
          color: #6557f5;
          font-family: inherit;
          font-weight: 800;
          font-size: 9px;
          cursor: pointer;
        }

        .pricing-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pricing-table th {
          padding: 9px 11px;
          background: #fafbfe;
          color: #999fad;
          font-size: 8px;
          text-align: right;
        }

        .pricing-table td {
          padding: 10px 11px;
          border-top: 1px solid #f0f2f5;
          font-size: 9px;
          color: #5e6577;
        }

        .pricing-cta {
          border-radius: 16px;
          background: linear-gradient(145deg, #6959f4, #7862ff);
          color: #fff;
          padding: 19px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .pricing-cta h3 {
          margin: 10px 0 5px;
          font-size: 16px;
        }

        .pricing-cta p {
          margin: 0;
          color: #e7e2ff;
          font-size: 9px;
          line-height: 1.8;
        }

        .pricing-cta button {
          border: 0;
          border-radius: 10px;
          background: #fff;
          color: #6557f5;
          padding: 10px;
          font-family: inherit;
          font-weight: 900;
          cursor: pointer;
        }

        .pricing-modules {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }

        .pricing-module {
          border: 1px solid #e8ebf2;
          border-radius: 14px;
          background: #fff;
          padding: 13px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: inherit;
          cursor: pointer;
          text-align: right;
        }

        .pricing-module strong {
          display: block;
          font-size: 10px;
          color: #343b4f;
        }

        .pricing-module small {
          display: block;
          margin-top: 3px;
          font-size: 8px;
          color: #a0a6b3;
        }

        @media (max-width: 1180px) {
          .pricing-action-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .pricing-main-grid {
            grid-template-columns: 1fr 1fr;
          }

          .pricing-main-grid .pricing-panel:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 760px) {
          .pricing-stats,
          .pricing-main-grid,
          .pricing-bottom,
          .pricing-modules {
            grid-template-columns: 1fr;
          }

          .pricing-action-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="pricing-head">
        <div>
          <div className="pricing-kicker">
            مركز التسعير
          </div>
          <h1>التسعير</h1>
          <p>
            إدارة الأسعار، العروض، الباقات والموردين
            والربحية.
          </p>
        </div>

        <button
          type="button"
          className="pricing-back"
          onClick={() => onNavigate?.("apps")}
        >
          العودة إلى التطبيقات
        </button>
      </div>

      <div className="pricing-stats">
        <StatCard
          icon={FileText}
          tone="blue"
          label="إجمالي عروض الأسعار"
          value={
            loading ? "..." : stats.totalQuotations
          }
          sub="كل العروض المسجلة"
        />

        <StatCard
          icon={BadgeDollarSign}
          tone="green"
          label="قيمة العروض"
          value={
            loading
              ? "..."
              : `${formatMoney(
                  stats.totalValue
                )} ر.س`
          }
          sub="إجمالي قيمة العروض"
        />

        <StatCard
          icon={CheckCircle2}
          tone="orange"
          label="العروض المعتمدة"
          value={
            loading ? "..." : stats.approvedCount
          }
          sub={`${formatMoney(
            stats.approvedValue
          )} ر.س معتمد`}
        />

        <StatCard
          icon={TrendingUp}
          tone="purple"
          label="متوسط هامش الربح"
          value={
            loading
              ? "..."
              : `${stats.averageMargin.toFixed(
                  1
                )}%`
          }
          sub="حسب أسعار المنتجات الحالية"
        />
      </div>

      <div className="pricing-card pricing-actions">
        <div className="pricing-title">
          أدوات التسعير السريعة
        </div>

        <div className="pricing-action-grid">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <button
                key={action.label}
                type="button"
                className="pricing-action"
                onClick={() => go(action.view)}
              >
                <span
                  className={`pricing-icon ${action.tone}`}
                >
                  <Icon size={18} />
                </span>
                <strong>{action.label}</strong>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pricing-main-grid">
        <div className="pricing-card pricing-panel">
          <div className="pricing-title">
            أداء التسعير خلال آخر 6 أشهر
          </div>

          <div className="pricing-chart">
            {[45, 58, 64, 61, 78, 92].map(
              (height, index) => (
                <div
                  className="pricing-bar-pair"
                  key={index}
                >
                  <div
                    className="pricing-bar"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                  <div
                    className="pricing-bar orange"
                    style={{
                      height: `${Math.max(
                        height - 35,
                        20
                      )}%`,
                    }}
                  />
                </div>
              )
            )}
          </div>

          <div className="pricing-months">
            <span>يناير</span>
            <span>فبراير</span>
            <span>مارس</span>
            <span>أبريل</span>
            <span>مايو</span>
            <span>يونيو</span>
          </div>
        </div>

        <div className="pricing-card pricing-panel">
          <div className="pricing-title">
            توزيع العروض حسب الحالة
          </div>

          <div className="pricing-status-list">
            <StatusRow
              color="#31b77b"
              label="مقبول"
              value={
                quotations.filter(
                  (item) =>
                    item.status === "approved"
                ).length
              }
            />

            <StatusRow
              color="#f4a23b"
              label="قيد المراجعة"
              value={
                quotations.filter(
                  (item) =>
                    item.status === "pending"
                ).length
              }
            />

            <StatusRow
              color="#ef5c61"
              label="مرفوض"
              value={
                quotations.filter(
                  (item) =>
                    item.status === "rejected"
                ).length
              }
            />

            <StatusRow
              color="#aab2c1"
              label="مسودة"
              value={
                quotations.filter(
                  (item) =>
                    item.status === "draft"
                ).length
              }
            />
          </div>
        </div>

        <div className="pricing-card pricing-panel">
          <div className="pricing-title">
            <Trophy
              size={14}
              style={{
                marginLeft: 6,
                verticalAlign: "middle",
              }}
            />
            أعلى المنتجات ربحية
          </div>

          <div className="pricing-profit-list">
            {topProducts.length ? (
              topProducts.map((product) => (
                <div
                  className="pricing-profit-row"
                  key={product.id}
                >
                  <strong>{product.name}</strong>
                  <span>
                    {product.margin.toFixed(1)}%
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "#999fad",
                  fontSize: 10,
                }}
              >
                لا توجد بيانات منتجات بعد.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pricing-bottom">
        <div className="pricing-card pricing-table-card">
      {pendingApprovalQuotations.length > 0 && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e9ebf2",
            borderRadius: 18,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: "#222b42",
                }}
              >
                عروض بانتظار الموافقة
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#9aa1af",
                  marginTop: 4,
                }}
              >
                راجع العرض ثم اعتمده أو أعده للتعديل.
              </div>
            </div>

            <div
              style={{
                minWidth: 32,
                height: 32,
                borderRadius: 10,
                background: "#fff3df",
                color: "#e48a19",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              {pendingApprovalQuotations.length}
            </div>
          </div>

          {approvalMessage && (
            <div
              style={{
                padding: "9px 11px",
                marginBottom: 12,
                borderRadius: 9,
                background:
                  approvalMessage.includes("تم")
                    ? "#ecf9f3"
                    : "#fff2f2",
                color:
                  approvalMessage.includes("تم")
                    ? "#16865f"
                    : "#d05257",
                fontSize: 9,
                fontWeight: 800,
              }}
            >
              {approvalMessage}
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 760,
              }}
            >
              <thead>
                <tr
                  style={{
                    color: "#9aa1af",
                    fontSize: 9,
                    textAlign: "right",
                  }}
                >
                  <th style={{ padding: "8px 10px" }}>رقم العرض</th>
                  <th style={{ padding: "8px 10px" }}>المشروع</th>
                  <th style={{ padding: "8px 10px" }}>الإصدار</th>
                  <th style={{ padding: "8px 10px" }}>القيمة</th>
                  <th style={{ padding: "8px 10px" }}>الحالة</th>
                  <th style={{ padding: "8px 10px" }}>الإجراء</th>
                </tr>
              </thead>

              <tbody>
                {pendingApprovalQuotations.map((quotation) => (
                  <tr
                    key={`approval-${quotation.id}`}
                    style={{
                      borderTop: "1px solid #f0f2f6",
                      fontSize: 10,
                    }}
                  >
                    <td style={{ padding: "11px 10px", fontWeight: 900 }}>
                      {quotation.quotation_number || `#${quotation.id}`}
                    </td>

                    <td style={{ padding: "11px 10px" }}>
                      {quotation.project?.name ||
                        quotation.project?.project_code ||
                        "—"}
                    </td>

                    <td style={{ padding: "11px 10px" }}>
                      V{quotation.version || 1}
                    </td>

                    <td style={{ padding: "11px 10px", fontWeight: 800 }}>
                      {Number(quotation.total || 0).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ر.س
                    </td>

                    <td style={{ padding: "11px 10px" }}>
                      <span
                        style={{
                          padding: "5px 8px",
                          borderRadius: 999,
                          background: "#fff3df",
                          color: "#d47c12",
                          fontWeight: 800,
                        }}
                      >
                        بانتظار الموافقة
                      </span>
                    </td>

                    <td style={{ padding: "11px 10px" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 7,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openQuotation(quotation)}
                          style={{
                            border: "1px solid #e4e7ef",
                            background: "#fff",
                            borderRadius: 8,
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 9,
                            fontWeight: 800,
                          }}
                        >
                          مراجعة
                        </button>

                        <button
                          type="button"
                          onClick={() => approveQuotation(quotation)}
                          disabled={approvalBusyId === quotation.id}
                          style={{
                            border: 0,
                            background: "#6657f5",
                            color: "#fff",
                            borderRadius: 8,
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 9,
                            fontWeight: 800,
                            opacity:
                              approvalBusyId === quotation.id ? 0.6 : 1,
                          }}
                        >
                          اعتماد
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            requestQuotationChanges(quotation)
                          }
                          disabled={approvalBusyId === quotation.id}
                          style={{
                            border: "1px solid #ffd7d8",
                            background: "#fff3f3",
                            color: "#d24d53",
                            borderRadius: 8,
                            padding: "7px 10px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 9,
                            fontWeight: 800,
                            opacity:
                              approvalBusyId === quotation.id ? 0.6 : 1,
                          }}
                        >
                          طلب تعديل
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


          <div className="pricing-table-head">
            <strong>أحدث عروض الأسعار</strong>
            <button
              type="button"
              onClick={() => go("quotations")}
            >
              عرض الكل
            </button>
          </div>

          <table className="pricing-table">
            <thead>
              <tr>
                <th>رقم العرض</th>
                <th>العميل / المشروع</th>
                <th>القيمة</th>
                <th>الحالة</th>
              </tr>
            </thead>

            <tbody>
              {recentQuotations.length ? (
                recentQuotations.map(
                  (quotation) => (
                    <tr
                      key={quotation.id}
                      onClick={() => openQuotation(quotation)}
                      style={{
                        cursor: quotation.status === "draft" ? "pointer" : "default",
                        background:
                          quotation.status === "draft" ? "#fbfaff" : undefined,
                      }}
                      title={
                        quotation.status === "draft"
                          ? "اضغط لفتح المسودة وتعديلها"
                          : ""
                      }
                    >
                      <td>
                        {quotation.quotation_number ||
                          `Q-${quotation.id}`}
                      </td>
                      <td>
                        {quotation.project
                          ?.customer_name ||
                          quotation.project?.name ||
                          "—"}
                      </td>
                      <td>
                        {formatMoney(
                          quotation.total
                        )}{" "}
                        ر.س
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "5px 8px",
                            borderRadius: 999,
                            background:
                              quotation.status === "draft"
                                ? "#eeeaff"
                                : "#f4f5f8",
                            color:
                              quotation.status === "draft"
                                ? "#6657f5"
                                : "#6f7685",
                            fontWeight: 800,
                          }}
                        >
                          {quotation.status === "draft"
                            ? "مسودة - فتح وتعديل"
                            : quotation.status || "—"}
                        </span>
                      </td>
                    </tr>
                  )
                )
              ) : (
                <tr>
                  <td colSpan="4">
                    لا توجد عروض حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pricing-cta">
          <div>
            <FilePlus2 size={28} />
            <h3>ابدأ عرض سعر جديد</h3>
            <p>
              تابع المنتجات والتكلفة والربحية قبل
              اعتماد العرض.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.("pricing-builder")}
          >
            إنشاء عرض سعر
          </button>
        </div>
      </div>

      <div className="pricing-modules">
        <ModuleCard
          icon={BadgeDollarSign}
          tone="green"
          title="قائمة الأسعار"
          sub="أسعار الشراء والبيع"
          onClick={() => go("price-list")}
        />

        <ModuleCard
          icon={FileText}
          tone="blue"
          title="عروض الأسعار"
          sub="جميع عروض العملاء"
          onClick={() => go("quotations")}
        />

        <ModuleCard
          icon={Boxes}
          tone="purple"
          title="الباقات"
          sub="Packages"
          onClick={() => go("pricing-packages")}
        />

        <ModuleCard
          icon={Users}
          tone="cyan"
          title="أسعار الموردين"
          sub="المقارنة بين الموردين"
          onClick={() => go("pricing-suppliers")}
        />

        <ModuleCard
          icon={Scale}
          tone="green"
          title="البدائل"
          sub="بدائل المنتجات"
          onClick={() =>
            go("pricing-alternatives")
          }
        />

        <ModuleCard
          icon={History}
          tone="purple"
          title="سجل الأسعار"
          sub="تاريخ تغير الأسعار"
          onClick={() => go("pricing-history")}
        />

        <ModuleCard
          icon={CheckCircle2}
          tone="orange"
          title="الموافقات"
          sub="اعتمادات التسعير"
          onClick={() =>
            go("pricing-approvals")
          }
        />

        <ModuleCard
          icon={BarChart3}
          tone="blue"
          title="تقارير التسعير"
          sub="تحليل الربح والأداء"
          onClick={() => go("pricing-reports")}
        />
      </div>
    </section>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}) {
  return (
    <article className="pricing-card pricing-stat">
      <div className="pricing-stat-top">
        <span className="pricing-stat-label">
          {label}
        </span>

        <span className={`pricing-icon ${tone}`}>
          <Icon size={18} />
        </span>
      </div>

      <div className="pricing-stat-value">
        {value}
      </div>

      <div className="pricing-stat-sub">
        {sub}
      </div>
    </article>
  );
}

function StatusRow({ color, label, value }) {
  return (
    <div className="pricing-status-row">
      <span className="pricing-status-name">
        <span
          className="pricing-dot"
          style={{ background: color }}
        />
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  );
}

function ModuleCard({
  icon: Icon,
  tone,
  title,
  sub,
  onClick,
}) {
  return (
    <button
      type="button"
      className="pricing-module"
      onClick={onClick}
    >
      <span className={`pricing-icon ${tone}`}>
        <Icon size={18} />
      </span>

      <span>
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
    </button>
  );
}
