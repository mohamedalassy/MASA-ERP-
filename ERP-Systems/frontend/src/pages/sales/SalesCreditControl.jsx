import {AlertTriangle, CreditCard, ShieldCheck, TimerReset} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesCreditControl({onNavigate,activeView="sales-credit"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>RECEIVABLES RISK</span><h1>Credit Control</h1><p>Manage exposure, aging and customers approaching credit limits.</p></div></header>
  <div className="sv3-credit-top"><div><CreditCard size={18}/><span>Total Receivables</span><b>SAR 1.34M</b></div><div><AlertTriangle size={18}/><span>Overdue</span><b>SAR 410K</b></div><div><ShieldCheck size={18}/><span>Within Limit</span><b>93%</b></div><div><TimerReset size={18}/><span>DSO</span><b>46 days</b></div></div>
  <div className="sv3-aging-chart"><h3>Aging Distribution</h3>{[["Current",610,46],["1–30",330,25],["31–60",210,16],["61–90",120,9],["90+",70,5]].map(([a,v,p])=><div key={a}><span>{a}</span><div className="bar"><i style={{width:`${p*2}%`}}/></div><b>SAR {v}K</b><strong>{p}%</strong></div>)}</div>
  <div className="sv3-credit-cards">{[["Gulf Logistics","SAR 210K","120%","Over Limit"],["Al Noor Contracting","SAR 142K","88%","Watch"],["Eastern Industrial","SAR 88K","44%","Healthy"]].map(([a,b,c,d])=><article key={a}><h3>{a}</h3><b>{b}</b><span>Exposure</span><div className="meter"><i style={{width:c}}/></div><footer><span>{c} of limit</span><strong>{d}</strong></footer></article>)}</div>
 </section></SalesWorkspace>
}
