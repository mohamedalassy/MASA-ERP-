import {CalendarClock, FileSignature, RefreshCw, ShieldCheck, TimerReset} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesContracts({onNavigate,activeView="sales-contracts"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>CONTRACT PORTFOLIO</span><h1>Contracts</h1><p>Track obligations, renewal windows and commercial exposure.</p></div></header>
  <div className="sv3-contract-summary"><div><FileSignature size={18}/><b>42</b><span>Active Contracts</span></div><div><ShieldCheck size={18}/><b>SAR 8.9M</b><span>Contract Value</span></div><div><CalendarClock size={18}/><b>6</b><span>Expiring Soon</span></div><div><RefreshCw size={18}/><b>81%</b><span>Renewal Rate</span></div></div>
  <div className="sv3-contract-timeline">
   {[
    ["CTR-2026-014","Eastern Industrial Co.","31 Dec 2026","Active","102 days",72],
    ["CTR-2026-011","National Clinics Group","14 Feb 2027","Active","144 days",58],
    ["CTR-2025-039","Gulf Logistics","31 Oct 2026","Renewal Due","38 days",88],
   ].map(([n,c,e,s,r,p])=><article key={n}><div className="sv3-contract-id"><span>{n}</span><h3>{c}</h3><small>{s}</small></div><div className="sv3-contract-life"><div className="line"><i style={{width:`${p}%`}}/></div><div><span>Start</span><b>{100-p}% elapsed</b><span>Expiry {e}</span></div></div><div className="sv3-renew-box"><TimerReset size={16}/><span>Renewal window</span><b>{r}</b></div></article>)}
  </div>
 </section></SalesWorkspace>
}
