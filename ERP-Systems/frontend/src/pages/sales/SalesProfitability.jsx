
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesProfitability({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/profitability/customers");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-profitability" onNavigate={onNavigate} title="Customer Profitability" description="Revenue وCost وNet Profit لكل عميل.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Customer Economics"><div className="sales-table"><div className="sales-table-head cols-6"><span>العميل</span><span>Revenue</span><span>Collected</span><span>Cost</span><span>Net Profit</span><span>Margin</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.customer_id}><strong>{x.customer}</strong><span>{money(x.revenue)}</span><span>{money(x.collected)}</span><span>{money(x.estimated_cost)}</span><b>{money(x.net_profit)}</b><StatusPill tone={x.margin>=20?"green":x.margin>=10?"orange":"red"}>{x.margin}%</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
