
import { SalesPageFrame, SalesMetric, SalesPanel, SalesState } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
import { BarChart3, CircleDollarSign, Target, TriangleAlert } from "lucide-react";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesReports({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/ai/command-center");
 const d=data||{};
 return <SalesPageFrame activeView="sales-reports" onNavigate={onNavigate} title="تقارير وتحليلات المبيعات" description="Executive reporting من نفس بيانات Command Center.">
 <SalesState loading={loading} error={error}><div className="sales-metrics-grid">
 <SalesMetric icon={CircleDollarSign} label="Won" value={money(d?.revenue?.won_this_month)} tone="purple"/><SalesMetric icon={BarChart3} label="Invoiced" value={money(d?.revenue?.invoiced_this_month)} tone="blue"/><SalesMetric icon={Target} label="Collected" value={money(d?.revenue?.collected_this_month)} tone="green"/><SalesMetric icon={TriangleAlert} label="At Risk" value={money(d?.risk?.revenue_at_risk)} tone="red"/>
 </div><SalesPanel title="Management Summary"><div className="sales-summary-lines"><div><span>Target achievement</span><strong>{d?.revenue?.target_achievement||0}%</strong></div><div><span>Open deals</span><strong>{d?.pipeline?.open_deals||0}</strong></div><div><span>Weighted pipeline</span><strong>{money(d?.pipeline?.weighted_pipeline)}</strong></div></div></SalesPanel></SalesState>
 </SalesPageFrame>
}
