import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Shell, Btn, Kpi, Panel } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";
const money=n=>new Intl.NumberFormat("en-US",{maximumFractionDigits:0}).format(Number(n||0));

export default function SalesAnalytics({onNavigate,activeView="ai-sales-analytics"}) {
  const [data,setData]=useState(null),[error,setError]=useState("");
  const load=()=>aiSalesRequest("/analytics").then(setData).catch(e=>setError(e?.message||"Unable to load analytics."));
  useEffect(()=>{load()},[]);
  const funnel=data?.funnel||{};
  const pipeline=(data?.pipeline_by_stage||[]).reduce((s,x)=>s+Number(x.value||0),0);

  return <Shell activeView={activeView} onNavigate={onNavigate} title="Sales Analytics"
    subtitle="Live funnel, pipeline, regions and buying-signal analytics.">
    {error&&<div className="ai-error">{error}</div>}
    <div className="kpi-grid analytics-kpis">
      <Kpi type="companies" title="Companies" value={funnel.companies??"..."}/>
      <Kpi type="leads" title="Leads" value={funnel.leads??"..."}/>
      <Kpi type="opportunities" title="Opportunities" value={funnel.opportunities??"..."}/>
      <Kpi type="pipeline" title="Pipeline" value={`SAR ${money(pipeline)}`}/>
      <Kpi type="rate" title="Won" value={funnel.won??"..."}/>
    </div>
    <div className="workspace-2">
      <Panel title="Pipeline by Stage" action={<Btn secondary onClick={load}><RefreshCw size={14}/> Refresh</Btn>}>
        {(data?.pipeline_by_stage||[]).length?(data.pipeline_by_stage.map(x=><div className="performance-row" key={x.stage}>
          <span>{x.stage||"Unknown"}</span><i><u style={{width:`${Math.min(100,Number(x.count||0)*15)}%`}}/></i>
          <b>{x.count} • SAR {money(x.value)}</b>
        </div>)):<p>No pipeline data yet.</p>}
      </Panel>
      <Panel title="Signals by Type">
        {(data?.signals_by_type||[]).length?data.signals_by_type.map(x=><div className="performance-row" key={x.type}>
          <span>{x.type}</span><i><u style={{width:`${Math.min(100,Number(x.count||0)*20)}%`}}/></i><b>{x.count}</b>
        </div>):<p>No signal data yet.</p>}
      </Panel>
    </div>
  </Shell>;
}