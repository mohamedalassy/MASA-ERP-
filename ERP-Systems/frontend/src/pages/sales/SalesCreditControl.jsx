
import { SalesPageFrame, SalesPanel, SalesState, StatusPill, ProgressBar } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesCreditControl({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/credit-control");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-credit-control" onNavigate={onNavigate} title="Customer Credit Control" description="الحد الائتماني والمستخدم والمتأخرات والمخاطر.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Credit Risk Desk"><div className="sales-table"><div className="sales-table-head cols-6"><span>العميل</span><span>Limit</span><span>Used</span><span>Available</span><span>Overdue</span><span>Risk</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.customer?.name||"-"}</strong><span>{money(x.credit_limit)}</span><div><span>{money(x.used_credit)}</span><ProgressBar value={Number(x.credit_limit)>0?Number(x.used_credit)/Number(x.credit_limit)*100:0} tone={x.risk_status==="high"?"red":"orange"}/></div><span>{money(x.available_credit)}</span><b>{money(x.overdue_amount)}</b><StatusPill tone={x.risk_status==="low"?"green":x.risk_status==="medium"?"orange":"red"}>{x.risk_status}</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
