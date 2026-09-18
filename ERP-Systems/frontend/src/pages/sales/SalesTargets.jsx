
import { SalesPageFrame, SalesPanel, SalesState, ProgressBar } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
const money=v=>new Intl.NumberFormat("ar-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(Number(v||0));
export default function SalesTargets({onNavigate}) {
 const {data,loading,error}=useSalesApi("/sales/targets/performance");
 const rows=Array.isArray(data)?data:[];
 return <SalesPageFrame activeView="sales-targets" onNavigate={onNavigate} title="الأهداف والحصص البيعية" description="Target vs Actual حسب الفرع والمندوب.">
 <SalesState loading={loading} error={error} empty={!rows.length}><SalesPanel title="Target Performance"><div className="sales-targets-grid">
 {rows.map((x,i)=><article className="sales-target-card" key={x.target?.id||i}><strong>{x.target?.user?.name||x.target?.branch?.name||"Branch Target"}</strong><div className="sales-target-values"><div><span>Target</span><strong>{money(x.target?.target_amount)}</strong></div><div><span>Actual</span><strong>{money(x.actual_amount)}</strong></div><div><span>Gap</span><strong>{money(x.gap)}</strong></div></div><ProgressBar value={x.achievement_percent} tone={x.achievement_percent>=90?"green":"orange"}/><small>{x.achievement_percent}%</small></article>)}
 </div></SalesPanel></SalesState>
 </SalesPageFrame>
}
