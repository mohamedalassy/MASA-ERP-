
import { CircleDollarSign, Target, TrendingUp, TriangleAlert } from "lucide-react";
import { SalesMetric, SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";

const money = (v) => new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));

export default function SalesCommandCenter({ onNavigate }) {
  const { data, loading, error, refresh } = useSalesApi("/sales/ai/command-center");
  const d = data || {};
  return (
    <SalesPageFrame activeView="sales" onNavigate={onNavigate} title="مركز قيادة المبيعات"
      description="الإيراد، الـPipeline، المخاطر وذكاء المبيعات من البيانات الحقيقية للنظام."
      actions={<button className="sales-btn soft" onClick={refresh}>تحديث</button>}>
      <SalesState loading={loading} error={error}>
        <div className="sales-metrics-grid">
          <SalesMetric icon={CircleDollarSign} label="Won this month" value={money(d?.revenue?.won_this_month)} note={`Target ${money(d?.revenue?.target)}`} tone="purple"/>
          <SalesMetric icon={TrendingUp} label="Pipeline" value={money(d?.pipeline?.pipeline_value)} note={`${d?.pipeline?.open_deals || 0} صفقة مفتوحة`} tone="blue"/>
          <SalesMetric icon={Target} label="Target Achievement" value={`${d?.revenue?.target_achievement || 0}%`} note={`Collected ${money(d?.revenue?.collected_this_month)}`} tone="green"/>
          <SalesMetric icon={TriangleAlert} label="Revenue at Risk" value={money(d?.risk?.revenue_at_risk)} note={`${d?.risk?.revenue_leakage_cases || 0} حالات`} tone="red"/>
        </div>
        <div className="sales-two-col">
          <SalesPanel title="AI & Risk Radar" subtitle="Revenue Intelligence">
            <div className="sales-attention-list">
              <div><span>At-risk deals</span><strong>{d?.risk?.at_risk_deals || 0}</strong></div>
              <div><span>High severity insights</span><strong>{d?.ai?.high_severity_insights || 0}</strong></div>
              <div><span>Overdue AI actions</span><strong>{d?.ai?.overdue_actions || 0}</strong></div>
            </div>
          </SalesPanel>
          <SalesPanel title="التدفق المتوقع" subtitle="Weighted Pipeline">
            <div className="sales-summary-lines">
              <div><span>Pipeline</span><strong>{money(d?.pipeline?.pipeline_value)}</strong></div>
              <div><span>Weighted</span><strong>{money(d?.pipeline?.weighted_pipeline)}</strong></div>
              <div><span>Open AI Insights</span><StatusPill tone="orange">{d?.ai?.open_insights || 0}</StatusPill></div>
            </div>
          </SalesPanel>
        </div>
      </SalesState>
    </SalesPageFrame>
  );
}
