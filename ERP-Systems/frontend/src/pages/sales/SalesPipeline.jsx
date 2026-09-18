
import { SalesPageFrame, SalesPanel, SalesState } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesPipeline({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/pipeline/summary");
 const rows=data?.pipeline||[];
 return <SalesPageFrame activeView="sales-pipeline" onNavigate={onNavigate} title="Sales Pipeline" description="ملخص مراحل الـPipeline حسب الفرع المختار.">
  <SalesState loading={loading} error={error}>
   <div className="sales-kanban">{rows.map(x=><section className="sales-kanban-col" key={x.stage}><header><strong>{x.stage}</strong><b>{money(x.value)}</b></header><div className="sales-kanban-empty">{x.deals} صفقات<br/>Weighted: {money(x.weighted_value)}</div></section>)}</div>
  </SalesState>
 </SalesPageFrame>
}
