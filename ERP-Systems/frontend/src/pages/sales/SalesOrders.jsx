
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesOrders({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/orders");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-orders" onNavigate={onNavigate} title="أوامر البيع" description="أوامر البيع الحقيقية وحالتها التشغيلية والمالية.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Sales Orders"><div className="sales-table"><div className="sales-table-head cols-6"><span>SO #</span><span>العميل</span><span>المشروع</span><span>القيمة</span><span>الحالة</span><span>التاريخ</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.order_number}</strong><span>{x.customer?.name||"-"}</span><span>{x.project?.name||"-"}</span><b>{money(x.total)}</b><StatusPill tone={x.status==="paid"?"green":x.status==="cancelled"?"red":"blue"}>{x.status}</StatusPill><span>{x.order_date||"-"}</span></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
