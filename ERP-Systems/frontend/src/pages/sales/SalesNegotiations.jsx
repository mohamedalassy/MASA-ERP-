
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
export default function SalesNegotiations({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/negotiations");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-negotiations" onNavigate={onNavigate} title="مركز التفاوض" description="طلبات الخصم وشروط الدفع والضمان والنطاق التجاري.">
  <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Negotiation Desk">
  <div className="sales-table"><div className="sales-table-head cols-6"><span>الموضوع</span><span>العميل</span><span>النوع</span><span>المطلوب</span><span>المعتمد</span><span>الحالة</span></div>
  {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.subject}</strong><span>{x.customer?.name||"-"}</span><span>{x.type}</span><span>{x.requested_value??"-"}</span><span>{x.approved_value??"-"}</span><StatusPill tone={x.status==="approved"?"green":"orange"}>{x.status}</StatusPill></div>)}</div>
  </SalesPanel></SalesState>
 </SalesPageFrame>
}
