import AISalesNav from "../../components/ai-sales/AISalesNav";
import {
  PageTitle,
  Btn,
  Kpi,
  Panel,
  Score,
  CompanyRows,
  companies,
  uiIcons,
} from "../../components/ai-sales/EnterpriseUI";

import "./ai-sales-enterprise.css";

export {
  PageTitle,
  Btn,
  Kpi,
  Panel,
  Score,
  CompanyRows,
  companies,
  uiIcons,
};

export function Shell({
  activeView,
  onNavigate,
  title,
  subtitle,
  children,
  actions,
}) {
  return (
    <div
      className="ai-enterprise ai-ar"
      dir="rtl"
      lang="ar"
    >
      <AISalesNav
        activeView={activeView}
        onNavigate={onNavigate}
      />

      <PageTitle
        title={title}
        subtitle={subtitle}
      >
        {actions}
      </PageTitle>

      {children}
    </div>
  );
}