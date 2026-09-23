import {BadgePercent, ChevronRight, CircleAlert, Handshake, MessageSquareText, Scale, ShieldCheck} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesNegotiations({onNavigate,activeView="sales-negotiations"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>DEAL DESK / NEGOTIATION</span><h1>Negotiations</h1><p>Protect margin while tracking concessions, blockers and decision progress.</p></div></header>
  <div className="sv3-neg-grid">
   <section className="sv3-neg-deals">
    <div className="sv3-neg-hero"><div><span>ACTIVE NEGOTIATIONS</span><b>18</b></div><div><span>VALUE</span><b>SAR 1.37M</b></div><div><span>AVG DISCOUNT</span><b>6.8%</b></div></div>
    {[
      ["Eastern Industrial Co.","SAR 380K","8%","Commercial approval","High"],
      ["National Clinics Group","SAR 510K","5%","Delivery schedule","Medium"],
      ["Al Noor Contracting","SAR 265K","7%","Payment terms","Medium"],
    ].map(([a,b,c,d,e],i)=><article key={a} className={i===0?"active":""}><div><Handshake size={17}/></div><div><b>{a}</b><span>{d}</span></div><strong>{b}</strong><em><BadgePercent size={12}/>{c}</em><small>{e}</small><ChevronRight size={15}/></article>)}
   </section>
   <section className="sv3-neg-workbench">
    <div className="sv3-neg-title"><span>SELECTED DEAL</span><h2>Eastern Industrial Co.</h2><p>Security Upgrade — Dammam Plant</p></div>
    <div className="sv3-neg-terms">
      <div><Scale size={16}/><span>List Price</span><b>SAR 410K</b></div>
      <div><BadgePercent size={16}/><span>Current Offer</span><b>SAR 380K</b></div>
      <div><ShieldCheck size={16}/><span>Margin Floor</span><b>SAR 364K</b></div>
    </div>
    <h3>Negotiation Timeline</h3>
    <div className="sv3-neg-thread">
      <div><span><MessageSquareText size={14}/></span><div><b>Customer requested 10% discount</b><small>Today, 11:20 • Procurement Director</small></div></div>
      <div><span><CircleAlert size={14}/></span><div><b>Margin threshold warning</b><small>Requested price would fall below target margin</small></div></div>
      <div><span><ShieldCheck size={14}/></span><div><b>Approved alternative: 7.3%</b><small>Sales Manager • Today, 12:05</small></div></div>
    </div>
   </section>
  </div>
 </section></SalesWorkspace>
}
