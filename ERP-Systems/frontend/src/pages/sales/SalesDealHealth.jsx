
import { SalesPageFrame, SalesPanel, SalesState, StatusPill, ProgressBar } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
export default function SalesDealHealth({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/deal-health");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-deal-health" onNavigate={onNavigate} title="Deal Health Center" description="Scoring ومخاطر الصفقات بناءً على النشاط والاحتمالية والإغلاق.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Deal Health"><div className="sales-table"><div className="sales-table-head cols-6"><span>الفرصة</span><span>العميل</span><span>Score</span><span>Inactive</span><span>Risk</span><span>Health</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.opportunity?.name||"-"}</strong><span>{x.opportunity?.customer?.name||"-"}</span><div><span>{x.score}</span><ProgressBar value={x.score} tone={x.score>=75?"green":x.score>=50?"orange":"red"}/></div><span>{x.days_since_activity}d</span><span>{x.risk_level}</span><StatusPill tone={x.health==="healthy"?"green":x.health==="watch"?"orange":"red"}>{x.health}</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
