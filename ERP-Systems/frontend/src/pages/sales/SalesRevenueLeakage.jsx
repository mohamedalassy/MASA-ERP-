
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesRevenueLeakage({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/revenue-leakage");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-revenue-leakage" onNavigate={onNavigate} title="Revenue Leakage Center" description="الإيراد المهدد من التسليم والفوترة والتحصيل والتجديدات.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Leakage Queue"><div className="sales-table"><div className="sales-table-head cols-6"><span>العميل</span><span>النوع</span><span>المرجع</span><span>القيمة</span><span>Severity</span><span>Status</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.customer?.name||"-"}</strong><span>{x.source_type}</span><span>{x.source_reference||"-"}</span><b>{money(x.amount)}</b><StatusPill tone={x.severity==="high"?"red":"orange"}>{x.severity}</StatusPill><span>{x.status}</span></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
