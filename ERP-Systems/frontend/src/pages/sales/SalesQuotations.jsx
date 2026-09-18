
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesQuotations({onNavigate}) {
 const {data,loading,error}=useSalesApi("/quotations",{branchAware:false});
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-quotations" onNavigate={onNavigate} title="عروض الأسعار" description="عروض الأسعار الحالية المرتبطة بالمشاريع والتسعير.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Quotations"><div className="sales-table"><div className="sales-table-head cols-6"><span>QT #</span><span>المشروع</span><span>العميل</span><span>Total</span><span>Version</span><span>Status</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.quotation_number}</strong><span>{x.project?.name||"-"}</span><span>{x.project?.customer_name||"-"}</span><b>{money(x.total)}</b><span>V{x.version}</span><StatusPill tone={x.status==="approved"?"green":x.status==="draft"?"purple":"orange"}>{x.status}</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
