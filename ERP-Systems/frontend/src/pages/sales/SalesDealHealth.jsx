import {AlertTriangle, HeartPulse, ShieldAlert, ShieldCheck} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesDealHealth({onNavigate,activeView="sales-deal-health"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>RISK INTELLIGENCE</span><h1>Deal Health</h1><p>Spot deterioration before opportunities slip or stall.</p></div></header>
  <div className="sv3-health-bands">{[[ShieldCheck,"Healthy","28","green"],[HeartPulse,"Needs Attention","12","blue"],[AlertTriangle,"At Risk","6","orange"],[ShieldAlert,"Critical","2","red"]].map(([I,a,b,t])=><div className={t} key={a}><I size={19}/><b>{b}</b><span>{a}</span></div>)}</div>
  <div className="sv3-risk-matrix"><div className="axis-y">Risk →</div><div className="grid">
   {[["Eastern Industrial","380K","low high"],["Gulf Logistics","195K","high medium"],["Al Noor","265K","medium high"],["Nova Medical","318K","low medium"],["Afaq","142K","high low"]].map(([a,b,c])=><button className={c} key={a}><b>{a}</b><span>SAR {b}</span></button>)}
  </div><div className="axis-x">Value / Strategic Importance →</div></div>
  <div className="sv3-risk-queue">{["No activity for 12 days","Close date moved twice","Discount increased beyond norm","Customer response slowing"].map((x,i)=><div key={x}><span>{i+1}</span><b>{x}</b><small>{["Gulf Logistics","Al Noor Contracting","Afaq Facilities","Gulf Logistics"][i]}</small></div>)}</div>
 </section></SalesWorkspace>
}
