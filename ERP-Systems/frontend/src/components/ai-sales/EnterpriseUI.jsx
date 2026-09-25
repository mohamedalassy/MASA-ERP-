import {
  UsersRound,
  Building2,
  Handshake,
  Coins,
  Target,
  TrendingUp,
  ArrowUpRight,
  Search,
  Sparkles,
  MapPin,
  ShieldCheck,
  BellRing,
  Activity,
  CheckCircle2,
} from "lucide-react";

export const companies = [
  {
    name: "Northstar Holdings",
    category: "Business Services",
    location: "Dammam",
    score: 92,
    added: "2h ago",
    value: "SAR 980,000",
    stage: "عرض",
  },
  {
    name: "Horizon Group",
    category: "Enterprise",
    location: "الرياض",
    score: 88,
    added: "3h ago",
    value: "SAR 2,500,000",
    stage: "عرض",
  },
  {
    name: "Future Ventures",
    category: "Professional Services",
    location: "Khobar",
    score: 85,
    added: "5h ago",
    value: "SAR 750,000",
    stage: "مؤهل",
  },
  {
    name: "Golden Group",
    category: "Commercial",
    location: "Jeddah",
    score: 82,
    added: "6h ago",
    value: "SAR 1,200,000",
    stage: "مؤهل",
  },
  {
    name: "National Trading Group",
    category: "Trading",
    location: "الرياض",
    score: 78,
    added: "8h ago",
    value: "SAR 1,800,000",
    stage: "تفاوض",
  },
];

export function Kpi({
  type,
  title,
  value,
  delta,
  note,
}) {
  const icons = {
    leads: UsersRound,
    companies: Building2,
    opportunities: Handshake,
    pipeline: Coins,
    rate: Target,
  };

  const Icon = icons[type] || TrendingUp;

  return (
    <article className={`ent-kpi ${type || ""}`}>
      <div className="kpi-icon">
        <Icon size={22} />
      </div>

      <div className="kpi-main">
        <span>{title}</span>

        <div>
          <strong>{value}</strong>

          {delta !== undefined &&
            delta !== null &&
            delta !== "" && (
              <em>↑ {delta}</em>
            )}
        </div>

        {note && <small>{note}</small>}
      </div>

      <div className="spark">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </article>
  );
}

export function Panel({
  title,
  action = null,
  onAction,
  children,
  className = "",
}) {
  const renderAction = () => {
    if (!action) {
      return null;
    }

    /*
     * If action is already JSX, render it directly.
     *
     * This prevents:
     *
     * <button>
     *   <button>...</button>
     * </button>
     */
    if (typeof action !== "string") {
      return (
        <div className="ent-panel-action">
          {action}
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={onAction}
        className="ent-panel-action-btn"
      >
        {action}

        <ArrowUpRight size={13} />
      </button>
    );
  };

  return (
    <section className={`ent-panel ${className}`}>
      {(title || action) && (
        <header>
          {title ? <h3>{title}</h3> : <span />}

          {renderAction()}
        </header>
      )}

      {children}
    </section>
  );
}

export function Score({ n }) {
  const value = Number(n) || 0;

  return (
    <b
      className={
        "score " +
        (value >= 85 ? "ai-score-high" : value >= 70 ? "ai-score-medium" : "ai-score-low")
      }
    >
      {value}
    </b>
  );
}

export function CompanyRows({
  rows = companies,
  onCompanyClick,
}) {
  return (
    <div className="data-table">
      <div className="tr th">
        <span>الشركة</span>
        <span>الفئة</span>
        <span>الموقع</span>
        <span>الدرجة</span>
        <span>تاريخ الإضافة</span>
      </div>

      {rows.map((company) => (
        <div
          className="tr"
          key={company.id ?? company.name}
          onClick={() =>
            onCompanyClick?.(company)
          }
          role={
            onCompanyClick
              ? "button"
              : undefined
          }
          tabIndex={
            onCompanyClick
              ? 0
              : undefined
          }
        >
          <b>{company.name}</b>

          <span>
            {company.category ??
              company.industry ??
              "—"}
          </span>

          <span>
            {company.location ??
              company.city ??
              "—"}
          </span>

          <Score
            n={
              company.score ??
              company.overall_score ??
              0
            }
          />

          <span>
            {company.added ??
              company.discovered_at ??
              "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PageTitle({
  eyebrow = "AI SALES",
  title,
  subtitle,
  children,
}) {
  return (
    <div className="page-title">
      <div>
        <small>{eyebrow}</small>

        <h1>{title}</h1>

        {subtitle && <p>{subtitle}</p>}
      </div>

      {children && (
        <aside>{children}</aside>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Enterprise Button
|--------------------------------------------------------------------------
|
| Important:
| Forward ALL normal button props:
| onClick, disabled, type, title, aria-*, etc.
|
*/
export function Btn({
  children,
  secondary = false,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        "ent-btn",
        secondary ? "secondary" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export const uiIcons = {
  Search,
  Sparkles,
  MapPin,
  ShieldCheck,
  BellRing,
  Activity,
  CheckCircle2,
  Building2,
  Handshake,
  Target,
  TrendingUp,
};