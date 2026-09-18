
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
export default function SalesActivities({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/activities");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-activities" onNavigate={onNavigate} title="الأنشطة والمتابعات" description="المكالمات والاجتماعات والزيارات والمهام والمتابعات.">
  <SalesState loading={loading} error={error} empty={!rows.length}>
   <SalesPanel title="Activities"><div className="sales-table"><div className="sales-table-head cols-6"><span>النشاط</span><span>العميل</span><span>النوع</span><span>الموعد</span><span>المسؤول</span><span>الحالة</span></div>
   {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.subject}</strong><span>{x.customer?.name||x.opportunity?.name||"-"}</span><span>{x.type}</span><span>{x.due_at||x.activity_at||"-"}</span><span>{x.owner?.name||"-"}</span><StatusPill tone={x.status==="completed"?"green":x.status==="cancelled"?"red":"orange"}>{x.status}</StatusPill></div>)}</div></SalesPanel>
  </SalesState>
 </SalesPageFrame>
}
