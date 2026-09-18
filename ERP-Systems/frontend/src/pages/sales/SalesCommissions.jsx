
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesCommissions({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/commissions");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-commissions" onNavigate={onNavigate} title="محرك العمولات" description="عمولات مبنية على التحصيل الفعلي.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Commission Statement"><div className="sales-table"><div className="sales-table-head cols-6"><span>المندوب</span><span>Basis</span><span>Eligible</span><span>Rate</span><span>Commission</span><span>Status</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.user?.name||"-"}</strong><span>{x.basis}</span><span>{money(x.eligible_amount)}</span><span>{x.rate}%</span><b>{money(x.commission_amount)}</b><StatusPill tone={x.status==="approved"?"green":"orange"}>{x.status}</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
