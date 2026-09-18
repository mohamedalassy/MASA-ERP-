
import { SalesPageFrame, SalesPanel, SalesState, StatusPill, ProgressBar } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesRenewals({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/renewals");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-renewals" onNavigate={onNavigate} title="Renewals Center" description="العقود المستحقة للتجديد وربطها بفرص جديدة.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Renewal Pipeline"><div className="sales-table"><div className="sales-table-head cols-6"><span>Renewal #</span><span>العميل</span><span>القيمة</span><span>Expiry</span><span>Probability</span><span>Status</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.renewal_number}</strong><span>{x.customer?.name||"-"}</span><b>{money(x.renewal_value)}</b><span>{x.expiry_date}</span><div><span>{x.probability}%</span><ProgressBar value={x.probability} tone="green"/></div><StatusPill tone={x.status==="converted"?"green":"orange"}>{x.status}</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
