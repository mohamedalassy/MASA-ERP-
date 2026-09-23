import {CalendarClock, ChevronRight, RefreshCw, ShieldAlert} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesRenewals({onNavigate,activeView="sales-renewals"}) {
 const lanes=[["0–30 days",[["Gulf Logistics","SAR 460K","38d"],["Afaq Facilities","SAR 180K","27d"]]],["31–60 days",[["Eastern Industrial","SAR 320K","52d"]]],["61–90 days",[["Nova Medical","SAR 210K","76d"],["Al Noor","SAR 185K","84d"]]]];
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>RECURRING REVENUE</span><h1>Renewals</h1><p>Protect upcoming contract value with time-based renewal execution.</p></div></header>
  <div className="sv3-renew-top"><div><RefreshCw size={18}/><span>Renewal Pipeline</span><b>SAR 1.14M</b></div><div><CalendarClock size={18}/><span>Due in 90 Days</span><b>18</b></div><div><ShieldAlert size={18}/><span>At Risk</span><b>5</b></div></div>
  <div className="sv3-renew-lanes">{lanes.map(([lane,items],li)=><section key={lane}><header><b>{lane}</b><span>{items.length} renewals</span></header>{items.map(([a,b,d])=><article key={a}><div><b>{a}</b><span>{b}</span></div><strong>{d}</strong><button>Open <ChevronRight size={13}/></button></article>)}</section>)}</div>
 </section></SalesWorkspace>
}
