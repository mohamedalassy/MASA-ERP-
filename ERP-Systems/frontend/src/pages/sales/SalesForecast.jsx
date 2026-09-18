
import { SalesPageFrame, SalesMetric, SalesState } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
import { LineChart, TrendingUp, WalletCards, BarChart3 } from "lucide-react";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesForecast({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/forecast");
 const d=data||{};
 return <SalesPageFrame activeView="sales-forecast" onNavigate={onNavigate} title="Sales Forecast" description="Committed / Likely / Upside من الفرص الفعلية.">
 <SalesState loading={loading} error={error}><div className="sales-metrics-grid">
 <SalesMetric icon={WalletCards} label="Committed" value={money(d.committed_value)} tone="green"/><SalesMetric icon={TrendingUp} label="Likely" value={money(d.likely_value)} tone="blue"/><SalesMetric icon={LineChart} label="Upside" value={money(d.upside_value)} tone="purple"/><SalesMetric icon={BarChart3} label="Coverage" value={`${d.coverage_ratio||0}×`} tone="orange"/>
 </div></SalesState>
 </SalesPageFrame>
}
