
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesContracts({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/contracts");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-contracts" onNavigate={onNavigate} title="العقود والاتفاقيات" description="العقود الفعالة والتجديدات والقيمة التعاقدية.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Contracts"><div className="sales-table"><div className="sales-table-head cols-6"><span>Contract #</span><span>العميل</span><span>النوع</span><span>القيمة</span><span>النهاية</span><span>الحالة</span></div>
 {rows.map(x=><div className="sales-table-row cols-6" key={x.id}><strong>{x.contract_number}</strong><span>{x.customer?.name||"-"}</span><span>{x.type}</span><b>{money(x.value)}</b><span>{x.end_date||"-"}</span><StatusPill tone={x.status==="active"?"green":"orange"}>{x.status}</StatusPill></div>)}</div></SalesPanel></SalesState>
 </SalesPageFrame>
}
