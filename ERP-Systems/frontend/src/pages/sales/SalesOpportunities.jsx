
import { SalesPageFrame, SalesPanel, SalesState, StatusPill, ProgressBar } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesOpportunities({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/opportunities");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-opportunities" onNavigate={onNavigate} title="الفرص البيعية" description="قيمة الفرص، المرحلة، الاحتمالية والعميل من الـBackend مباشرة.">
  <SalesState loading={loading} error={error} empty={!rows.length}>
   <SalesPanel title="Opportunities" subtitle={`${rows.length} فرصة`}>
    <div className="sales-table"><div className="sales-table-head cols-6"><span>الفرصة</span><span>العميل</span><span>القيمة</span><span>المرحلة</span><span>الاحتمالية</span><span>الإغلاق</span></div>
    {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.name}</strong><span>{x.customer?.name||"-"}</span><b>{money(x.expected_value)}</b><StatusPill tone="orange">{x.stage}</StatusPill><div><span>{x.probability}%</span><ProgressBar value={x.probability} tone="green"/></div><span>{x.expected_close_date||"-"}</span></div>)}</div>
   </SalesPanel>
  </SalesState>
 </SalesPageFrame>
}
