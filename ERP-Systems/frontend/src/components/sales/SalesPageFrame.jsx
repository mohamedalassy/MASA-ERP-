
import {
  BarChart3, BriefcaseBusiness, Building2, CalendarCheck2, CircleDollarSign,
  FileCheck2, FileText, Handshake, LayoutDashboard, LineChart, Repeat2,
  ShieldCheck, ShoppingBag, Target, TrendingUp, Trophy, Users, WalletCards, Workflow
} from "lucide-react";
import SalesBranchSelector from "./SalesBranchSelector";

const navItems = [
  { id: "sales", label: "القيادة", icon: LayoutDashboard },
  { id: "sales-leads", label: "Leads", icon: Users },
  { id: "sales-opportunities", label: "الفرص", icon: Target },
  { id: "sales-pipeline", label: "Pipeline", icon: BriefcaseBusiness },
  { id: "sales-customers", label: "Customer 360", icon: Building2 },
  { id: "sales-activities", label: "الأنشطة", icon: CalendarCheck2 },
  { id: "sales-quotations", label: "العروض", icon: FileText },
  { id: "sales-negotiations", label: "التفاوض", icon: Handshake },
  { id: "sales-orders", label: "أوامر البيع", icon: ShoppingBag },
  { id: "sales-contracts", label: "العقود", icon: FileCheck2 },
  { id: "sales-targets", label: "Targets", icon: Trophy },
  { id: "sales-commissions", label: "العمولات", icon: WalletCards },
  { id: "sales-forecast", label: "Forecast", icon: LineChart },
  { id: "sales-deal-health", label: "Deal Health", icon: ShieldCheck },
  { id: "sales-revenue-leakage", label: "Leakage", icon: CircleDollarSign },
  { id: "sales-credit-control", label: "Credit", icon: Workflow },
  { id: "sales-profitability", label: "Profitability", icon: TrendingUp },
  { id: "sales-renewals", label: "Renewals", icon: Repeat2 },
  { id: "sales-reports", label: "التقارير", icon: BarChart3 },
];

export function SalesPageFrame({ activeView, onNavigate, title, description, actions, children }) {
  return (
    <div className="sales-premium-page" dir="rtl">
      <div className="sales-module-nav">
        <div className="sales-module-brand">
          <div className="sales-module-mark">S</div>
          <div><strong>Sales Suite</strong><span>MASA ERP</span></div>
        </div>
        <div className="sales-module-tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={activeView === item.id ? "active" : ""}
                onClick={() => onNavigate?.(item.id)}
              >
                <Icon size={15} /><span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <header className="sales-premium-header">
        <div>
          <span className="sales-eyebrow">MASA SALES</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="sales-header-actions">
          <SalesBranchSelector />
          {actions}
        </div>
      </header>
      {children}
    </div>
  );
}

export function SalesMetric({ icon: Icon, label, value, note, tone = "purple" }) {
  return (
    <article className="sales-metric-card">
      <div className={`sales-metric-icon ${tone}`}>{Icon ? <Icon size={20} /> : null}</div>
      <div><span>{label}</span><strong>{value}</strong>{note ? <small>{note}</small> : null}</div>
    </article>
  );
}

export function SalesPanel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`sales-premium-panel ${className}`}>
      <div className="sales-panel-title">
        <div>{subtitle ? <span>{subtitle}</span> : null}<h2>{title}</h2></div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ children, tone = "purple" }) {
  return <span className={`sales-pill ${tone}`}>{children}</span>;
}

export function ProgressBar({ value = 0, tone = "purple" }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="sales-progress"><i className={tone} style={{ width: `${safe}%` }} /></div>;
}

export function SalesState({ loading, error, empty, children }) {
  if (loading) return <div className="sales-premium-panel sales-state">جاري تحميل البيانات...</div>;
  if (error) return <div className="sales-premium-panel sales-state error">{error}</div>;
  if (empty) return <div className="sales-premium-panel sales-state">لا توجد بيانات حاليًا.</div>;
  return children;
}
