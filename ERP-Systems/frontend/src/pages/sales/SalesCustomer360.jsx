
import { SalesPageFrame, SalesPanel, SalesState } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
export default function SalesCustomer360({onNavigate}) {
 const {data,loading,error}=useSalesApi("/customers");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-customers" onNavigate={onNavigate} title="Customer 360" description="قائمة العملاء الموحدة؛ اضغط على العميل لاحقًا لفتح ملف 360 تفصيلي.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Customers"><div className="sales-table"><div className="sales-table-head cols-6"><span>Code</span><span>العميل</span><span>القطاع</span><span>الهاتف</span><span>الفرع</span><span>المشاريع</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.code}</strong><span>{x.name}</span><span>{x.industry||"-"}</span><span>{x.phone||"-"}</span><span>{x.branch?.name||"-"}</span><span>{x.projects_count||0}</span></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
