import {AlertOctagon, CircleDollarSign, FileWarning, RefreshCw, ScanSearch} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesRevenueLeakage({onNavigate,activeView="sales-leakage"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>REVENUE ASSURANCE</span><h1>Revenue Leakage</h1><p>Exception monitoring for revenue that is earned, due or at risk of being missed.</p></div></header>
  <div className="sv3-leak-hero"><div><AlertOctagon size={21}/><span>Potential Leakage</span><b>SAR 640K</b><small>18 open exceptions</small></div><div><span>Delivered not invoiced</span><b>SAR 240K</b></div><div><span>Overdue invoices</span><b>SAR 310K</b></div><div><span>Renewals missed</span><b>SAR 90K</b></div></div>
  <div className="sv3-leak-console">{[
   ["Critical","Delivered not invoiced","SO-2026-0817","SAR 86K","2 days"],
   ["High","Overdue receivable","INV-2026-124","SAR 74K","18 days"],
   ["High","Renewal not initiated","CTR-2025-039","SAR 90K","38 days"],
   ["Medium","Partial billing variance","SO-2026-0802","SAR 42K","4 days"],
  ].map(([s,t,r,v,a],i)=><article key={r} className={"sev"+i}><span className="sev">{s}</span><div><b>{t}</b><small>{r}</small></div><strong>{v}</strong><em>{a}</em><button><ScanSearch size={14}/> Investigate</button></article>)}</div>
 </section></SalesWorkspace>
}
