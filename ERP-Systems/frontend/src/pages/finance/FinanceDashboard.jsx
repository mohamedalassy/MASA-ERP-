import { useMemo } from "react";
import {
  Banknote,
  BookOpen,
  Building2,
  Calculator,
  CircleDollarSign,
  Landmark,
  Layers3,
  PieChart,
  Printer,
  ReceiptText,
  Scale,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  FinancePageShell,
  InsightStrip,
  KpiGrid,
  SectionCard,
  FinanceTable,
  money,
  useFinanceDashboard,
} from "./FinancePageShared";

/* =========================================================
   Labels
========================================================= */

const statusLabels = {
  draft: "مسودة",
  pending: "قيد المراجعة",
  approved: "معتمد",
  posted: "مرحّل",
  rejected: "مرفوض",
  cancelled: "ملغي",
  paid: "مدفوع",
  partially_paid: "مدفوع جزئيًا",
  overdue: "متأخر",
};

const transactionTypeLabels = {
  customer_invoice: "فاتورة عميل",
  customer_payment: "تحصيل عميل",
  supplier_invoice: "فاتورة مورد",
  supplier_payment: "دفعة مورد",
  expense: "مصروف",
  refund: "مرتجع",
  adjustment: "تسوية",
};

/* =========================================================
   Finance Modules
========================================================= */

const modules = [
  {
    id: "finance-journal",
    title: "القيود اليومية",
    description: "إنشاء ومراجعة وترحيل القيود المحاسبية",
    icon: BookOpen,
  },
  {
    id: "finance-chart-accounts",
    title: "دليل الحسابات",
    description: "إدارة شجرة الحسابات والحسابات الفرعية",
    icon: Layers3,
  },
  {
    id: "finance-general-ledger",
    title: "دفتر الأستاذ العام",
    description: "الحركات المرحلة والأرصدة وميزان المراجعة",
    icon: Scale,
  },
  {
    id: "finance-collections-center",
    title: "مركز التحصيلات",
    description: "الفواتير والمستحقات وأعمار الديون ومتابعة التحصيل",
    icon: CircleDollarSign,
  },
  {
    id: "finance-suppliers",
    title: "الموردون والمدفوعات",
    description: "المستحقات وفواتير الموردين والمدفوعات",
    icon: ReceiptText,
  },
  {
    id: "finance-banks",
    title: "البنوك والخزينة",
    description: "الحسابات البنكية والنقدية والتسويات",
    icon: Landmark,
  },
  {
    id: "finance-fixed-assets",
    title: "الأصول الثابتة",
    description: "تسجيل الأصول وحساب الإهلاك والقيود المرتبطة بها",
    icon: Building2,
    disabled: true,
  },
  {
    id: "finance-cost-centers",
    title: "مراكز التكلفة",
    description: "تحليل المصروفات والإيرادات حسب المركز",
    icon: PieChart,
  },
  {
    id: "finance-projects",
    title: "محاسبة المشاريع",
    description: "تكلفة وربحية وتدفقات كل مشروع",
    icon: Building2,
  },
  {
    id: "finance-tax-invoices",
    title: "الفواتير الضريبية",
    description: "إنشاء وإدارة الفواتير الكاملة والجزئية والمرحلية",
    icon: ReceiptText,
  },
  {
    id: "finance-vat-center",
    title: "ضريبة القيمة المضافة وZATCA",
    description:
      "ضريبة المخرجات والمدخلات وصافي الالتزام والفوترة الإلكترونية",
    icon: Calculator,
  },
  {
    id: "finance-tax-profile",
    title: "الملف الضريبي",
    description: "بيانات المنشأة والرقم الضريبي والعنوان الوطني",
    icon: Building2,
    disabled: true,
  },
  {
    id: "finance-customer-tax-profile",
    title: "بيانات العملاء الضريبية",
    description:
      "الرقم الضريبي والسجل التجاري والعنوان الوطني للمشترين",
    icon: Building2,
    disabled: true,
  },
  {
    id: "finance-income-statement",
    title: "قائمة الدخل",
    description: "الإيرادات والمصروفات وصافي الربح أو الخسارة",
    icon: TrendingUp,
  },
  {
    id: "finance-balance-sheet",
    title: "الميزانية العمومية",
    description:
      "الأصول والالتزامات وحقوق الملكية والمؤشرات المالية",
    icon: Landmark,
  },
  {
    id: "finance-cash-flow",
    title: "التدفقات النقدية",
    description: "المقبوضات والمدفوعات والسيولة والأنشطة النقدية",
    icon: WalletCards,
  },
  {
    id: "finance-reports",
    title: "مركز الطباعة والتقارير",
    description: "طباعة وتصدير القوائم والدفاتر والتقارير المحاسبية",
    icon: Printer,
  },
];

/* =========================================================
   Finance Dashboard
========================================================= */

export default function FinanceDashboard({ onNavigate }) {
  const {
    data: dashboard,
    loading,
    error,
    load,
  } = useFinanceDashboard("year");

  const kpis = dashboard?.kpis || {};

  const netMargin = useMemo(() => {
    const income = Number(kpis.income || 0);
    const net = Number(kpis.net || 0);

    if (income <= 0) {
      return 0;
    }

    return (net / income) * 100;
  }, [kpis.income, kpis.net]);

  /* =========================================================
     KPI Cards
  ========================================================= */

  const mainKpis = [
    {
      label: "إجمالي الإيرادات",
      value: `${money(kpis.income)} ر.س`,
      icon: TrendingUp,
      tone: "green",
      meta: "الحركات المالية الدائنة للمشاريع",
      metaTone: "positive",
    },
    {
      label: "إجمالي المصروفات",
      value: `${money(kpis.expenses)} ر.س`,
      icon: TrendingDown,
      tone: "red",
      meta: `مصروفات المشاريع ${money(
        kpis.project_expenses
      )} ر.س`,
      metaTone: "negative",
    },
    {
      label: "صافي الحركة",
      value: `${money(kpis.net)} ر.س`,
      icon: Banknote,
      tone: "purple",
      meta: `هامش حالي ${netMargin.toFixed(1)}%`,
      metaTone:
        Number(kpis.net || 0) >= 0 ? "positive" : "negative",
    },
    {
      label: "مستحقات العملاء",
      value: `${money(kpis.receivables)} ر.س`,
      icon: WalletCards,
      tone: "blue",
      meta: `${Number(
        kpis.overdue_transactions || 0
      )} حركة متأخرة`,
      metaTone:
        Number(kpis.overdue_transactions || 0) > 0
          ? "negative"
          : "neutral",
    },
  ];

  /* =========================================================
     Insights
  ========================================================= */

  const insights = [
    {
      label: "مستحقات الموردين",
      value: `${money(kpis.payables)} ر.س`,
      icon: ReceiptText,
    },
    {
      label: "المشتريات المعتمدة",
      value: `${money(kpis.approved_purchases)} ر.س`,
      icon: WalletCards,
    },
    {
      label: "مشاريع داخل المالية",
      value: Number(kpis.projects_in_finance || 0),
      icon: Building2,
    },
    {
      label: "قيود تنتظر الاعتماد",
      value: Number(kpis.pending_entries || 0),
      icon: BookOpen,
    },
  ];

  /* =========================================================
     Transactions Table
  ========================================================= */

  const transactionColumns = [
    {
      key: "title",
      label: "الحركة",
      render: (transaction) => (
        <div>
          <strong>
            {transaction.title ||
              transactionTypeLabels[transaction.type] ||
              "حركة مالية"}
          </strong>

          <div style={{ marginTop: 4, opacity: 0.6 }}>
            {transaction.reference_number ||
              transactionTypeLabels[transaction.type] ||
              "—"}
          </div>
        </div>
      ),
    },
    {
      key: "project",
      label: "المشروع",
      render: (transaction) => (
        <div>
          <strong>{transaction.project?.name || "—"}</strong>

          <div style={{ marginTop: 4, opacity: 0.6 }}>
            {transaction.project?.project_code || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "الحالة",
      render: (transaction) =>
        statusLabels[transaction.status] ||
        transaction.status ||
        "—",
    },
    {
      key: "total",
      label: "القيمة",
      render: (transaction) => (
        <strong>
          {transaction.direction === "income" ? "+" : "-"}
          {money(transaction.total)} ر.س
        </strong>
      ),
    },
  ];

  /* =========================================================
     Navigation
  ========================================================= */

  const openModule = (module) => {
    if (module.disabled) {
      return;
    }

    onNavigate?.(module.id);
  };

  return (
    <FinancePageShell
      icon={Calculator}
      title="لوحة المحاسبة"
      description="نظرة موحدة على الإيرادات والمصروفات والمستحقات وحركة المشاريع والقيود المحاسبية."
      loading={loading}
      error={error}
      onRefresh={load}
      actions={
        <button
          type="button"
          className="finx-btn finx-btn-primary"
          onClick={() => onNavigate?.("finance-journal")}
        >
          <BookOpen size={17} />
          قيد يومية جديد
        </button>
      }
    >
      {/* =====================================================
          Main KPIs
      ===================================================== */}

      <KpiGrid items={mainKpis} />

      {/* =====================================================
          Finance Insights
      ===================================================== */}

      <InsightStrip items={insights} />

      {/* =====================================================
          Financial Overview
      ===================================================== */}

      <div className="finx-grid">
        {/* Cash Flow */}

        <SectionCard
          className="finx-span-7"
          title="الإيرادات مقابل المصروفات"
          subtitle="ملخص بصري للحركة المالية الحالية"
          icon={TrendingUp}
        >
          <div className="finx-insight-strip">
            <div className="finx-insight">
              <TrendingUp size={18} />

              <div>
                <span>إجمالي الإيرادات</span>
                <strong>{money(kpis.income)} ر.س</strong>
              </div>
            </div>

            <div className="finx-insight">
              <TrendingDown size={18} />

              <div>
                <span>إجمالي المصروفات</span>
                <strong>{money(kpis.expenses)} ر.س</strong>
              </div>
            </div>

            <div className="finx-insight">
              <Banknote size={18} />

              <div>
                <span>صافي الحركة</span>
                <strong>{money(kpis.net)} ر.س</strong>
              </div>
            </div>

            <div className="finx-insight">
              <Calculator size={18} />

              <div>
                <span>هامش الحركة</span>
                <strong>{netMargin.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          <div className="finx-trend">
            {[48, 62, 55, 77, 68, 88].map(
              (value, index) => (
                <div
                  className="finx-trend-col"
                  key={index}
                >
                  <div className="finx-trend-bars">
                    <span
                      className="finx-trend-bar income"
                      style={{
                        height: `${value}%`,
                      }}
                    />

                    <span
                      className="finx-trend-bar expense"
                      style={{
                        height: `${Math.max(
                          value - 22,
                          20
                        )}%`,
                      }}
                    />
                  </div>

                  <span>
                    {
                      [
                        "مار",
                        "أبر",
                        "ماي",
                        "يون",
                        "يول",
                        "أغس",
                      ][index]
                    }
                  </span>
                </div>
              )
            )}
          </div>
        </SectionCard>

        {/* Receivables / Payables */}

        <SectionCard
          className="finx-span-5"
          title="الذمم المالية"
          subtitle="مستحقات العملاء مقابل الموردين"
          icon={WalletCards}
        >
          <div className="finx-aging-list">
            <div>
              <div className="finx-aging-label">
                <span>مستحقات العملاء</span>
                <b>
                  {money(kpis.receivables)} ر.س
                </b>
              </div>

              <div className="finx-bar-track">
                <div
                  className="finx-bar-fill"
                  style={{ width: "74%" }}
                />
              </div>
            </div>

            <div>
              <div className="finx-aging-label">
                <span>مستحقات الموردين</span>
                <b>
                  {money(kpis.payables)} ر.س
                </b>
              </div>

              <div className="finx-bar-track">
                <div
                  className="finx-bar-fill"
                  style={{ width: "52%" }}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Project Profitability */}

        <SectionCard
          className="finx-span-6"
          title="الأداء المالي للمشاريع"
          subtitle="نظرة سريعة على نشاط المشاريع"
          icon={Building2}
        >
          <div className="finx-profit-list">
            <div>
              <div className="finx-profit-label">
                <div>
                  <strong>هامش الحركة الحالي</strong>
                  <span>
                    الإيرادات مقابل صافي الحركة
                  </span>
                </div>

                <strong
                  className={
                    netMargin >= 0
                      ? "positive"
                      : "negative"
                  }
                >
                  {netMargin.toFixed(1)}%
                </strong>
              </div>

              <div className="finx-bar-track">
                <div
                  className={`finx-profit-fill ${
                    netMargin >= 0
                      ? "positive"
                      : "negative"
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        Math.abs(netMargin)
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className="finx-insight-strip"
            style={{ marginTop: 20 }}
          >
            <div className="finx-insight">
              <Building2 size={18} />

              <div>
                <span>مشاريع داخل المالية</span>
                <strong>
                  {Number(
                    kpis.projects_in_finance || 0
                  )}
                </strong>
              </div>
            </div>

            <div className="finx-insight">
              <ReceiptText size={18} />

              <div>
                <span>مصاريف المشاريع</span>
                <strong>
                  {money(kpis.project_expenses)} ر.س
                </strong>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Journal Status */}

        <SectionCard
          className="finx-span-6"
          title="حالة القيود اليومية"
          subtitle="متابعة الاعتماد والترحيل"
          icon={BookOpen}
        >
          <div className="finx-insight-strip">
            <div className="finx-insight">
              <BookOpen size={18} />

              <div>
                <span>إجمالي القيود</span>
                <strong>
                  {Number(kpis.posted_entries || 0) +
                    Number(
                      kpis.pending_entries || 0
                    )}
                </strong>
              </div>
            </div>

            <div className="finx-insight">
              <Calculator size={18} />

              <div>
                <span>قيد المراجعة</span>
                <strong>
                  {Number(
                    kpis.pending_entries || 0
                  )}
                </strong>
              </div>
            </div>

            <div className="finx-insight">
              <BookOpen size={18} />

              <div>
                <span>تم الترحيل</span>
                <strong>
                  {Number(
                    kpis.posted_entries || 0
                  )}
                </strong>
              </div>
            </div>

            <div className="finx-insight">
              <TrendingDown size={18} />

              <div>
                <span>حركات متأخرة</span>
                <strong>
                  {Number(
                    kpis.overdue_transactions || 0
                  )}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="finx-btn finx-btn-soft"
            onClick={() =>
              onNavigate?.("finance-journal")
            }
          >
            <BookOpen size={16} />
            فتح القيود اليومية
          </button>
        </SectionCard>
      </div>

      {/* =====================================================
          Finance Modules
      ===================================================== */}

      <section className="finx-print-center">
        <div className="finx-print-center-head">
          <div>
            <span>MASA FINANCE</span>
            <h2>الوحدات المالية</h2>
            <p>
              الوصول السريع إلى أقسام المحاسبة
              والتقارير والعمليات المالية.
            </p>
          </div>

          <Calculator size={26} />
        </div>

        <div className="finx-print-links">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.id}
                type="button"
                onClick={() => openModule(module)}
                disabled={module.disabled}
                title={
                  module.disabled
                    ? "سيتم استكمال هذه الوحدة لاحقًا"
                    : module.title
                }
                style={
                  module.disabled
                    ? {
                        opacity: 0.55,
                        cursor: "not-allowed",
                      }
                    : undefined
                }
              >
                <span>
                  <Icon size={19} />
                </span>

                <div>
                  <strong>
                    {module.title}
                    {module.disabled
                      ? " — قريبًا"
                      : ""}
                  </strong>

                  <small>
                    {module.description}
                  </small>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          Recent Transactions
      ===================================================== */}

      <div className="finx-grid">
        <SectionCard
          className="finx-span-8"
          title="أحدث الحركات المالية"
          subtitle="آخر حركات المشاريع المسجلة"
          icon={Banknote}
        >
          <FinanceTable
            searchable={false}
            rows={dashboard?.recent_transactions || []}
            columns={transactionColumns}
            emptyText="لا توجد حركات مالية مسجلة حتى الآن."
          />
        </SectionCard>

        <SectionCard
          className="finx-span-4"
          title="ملخص المالية"
          subtitle="المؤشرات التشغيلية الحالية"
          icon={Calculator}
        >
          <div className="finx-aging-list">
            <div>
              <div className="finx-aging-label">
                <span>قيود قيد المراجعة</span>
                <b>
                  {Number(
                    kpis.pending_entries || 0
                  )}
                </b>
              </div>
            </div>

            <div>
              <div className="finx-aging-label">
                <span>قيود تم ترحيلها</span>
                <b>
                  {Number(
                    kpis.posted_entries || 0
                  )}
                </b>
              </div>
            </div>

            <div>
              <div className="finx-aging-label">
                <span>حركات متأخرة</span>
                <b>
                  {Number(
                    kpis.overdue_transactions || 0
                  )}
                </b>
              </div>
            </div>

            <div>
              <div className="finx-aging-label">
                <span>المشتريات المعتمدة</span>
                <b>
                  {money(
                    kpis.approved_purchases
                  )}{" "}
                  ر.س
                </b>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="finx-btn finx-btn-primary"
            style={{ marginTop: 18 }}
            onClick={() =>
              onNavigate?.("finance-reports")
            }
          >
            <Printer size={16} />
            مركز التقارير
          </button>
        </SectionCard>
      </div>
    </FinancePageShell>
  );
}