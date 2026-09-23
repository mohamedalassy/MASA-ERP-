import {CheckCircle2, Clock3, FileText, Plus, RotateCcw, Search, ShieldCheck} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesQuotations({onNavigate,activeView="sales-quotations"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>COMMERCIAL DESK</span><h1>Quotations</h1><p>Manage revisions, approvals, margin protection and conversion.</p></div><button className="sv3-primary" onClick={()=>onNavigate?.("sales-create-quotation")}><Plus size={15}/> New Quotation</button></header>
  <div className="sv3-quote-ribbon"><div><b>36</b><span>Open Quotes</span></div><div><b>SAR 2.48M</b><span>Quoted Value</span></div><div><b>42%</b><span>Conversion</span></div><div><b>7</b><span>Approval Pending</span></div></div>
  <div className="sv3-quote-layout">
    <main className="sv3-quote-list">
      <div className="sv3-search-lg"><Search size={15}/><input placeholder="Search quotation, project or customer..."/></div>
      {[
        ["QT-2026-0088","Eastern Industrial Co.","Security Upgrade","SAR 380,000","Rev 3","Approval Pending"],
        ["QT-2026-0083","National Clinics Group","CCTV Rollout","SAR 510,000","Rev 2","Sent"],
        ["QT-2026-0079","Al Noor Contracting","HQ Low Current","SAR 265,000","Rev 1","Negotiation"],
        ["QT-2026-0075","Gulf Logistics","Network Refresh","SAR 195,000","Rev 4","Approved"],
      ].map((r,i)=><article key={r[0]}>
        <div className="sv3-quote-doc"><FileText size={19}/><small>{r[0]}</small></div><div className="copy"><b>{r[2]}</b><span>{r[1]}</span></div><strong>{r[3]}</strong><span className="rev"><RotateCcw size={12}/>{r[4]}</span><em className={"q"+i}>{r[5]}</em>
      </article>)}
    </main>
    <aside className="sv3-approval-flow">
      <span className="sv3-kicker">APPROVAL WORKFLOW</span><h2>QT-2026-0088</h2><p>Security Upgrade — Dammam Plant</p>
      {[["Prepared","Done",CheckCircle2],["Margin Review","Done",ShieldCheck],["Sales Manager","Pending",Clock3],["Customer","Not sent",FileText]].map(([a,b,I],i)=><div className="sv3-approval-step" key={a}><span className={i<2?"done":i===2?"active":""}><I size={15}/></span><div><b>{a}</b><small>{b}</small></div></div>)}
      <div className="sv3-margin-box"><span>Gross Margin</span><b>31.8%</b><small>Above floor by 4.8 pts</small></div>
    </aside>
  </div>
 </section></SalesWorkspace>
}
