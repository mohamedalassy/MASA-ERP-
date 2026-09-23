import {ArrowRight, CalendarClock, CheckCircle2, CircleAlert, FileText, Gauge, ShieldCheck, Sparkles} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesOpportunityDetails({onNavigate}) {
 return <SalesWorkspace activeView="sales-opportunities" onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-opportunity-hero"><div><span>OPPORTUNITY WORKSPACE</span><h1>Security Upgrade — Dammam Plant</h1><p>Eastern Industrial Co. • Negotiation</p><b>SAR 380,000</b></div><div className="sv3-opportunity-score"><div><Gauge size={18}/><b>78%</b><span>Probability</span></div><div><Sparkles size={18}/><b>87</b><span>Health</span></div><div><CalendarClock size={18}/><b>30 Sep</b><span>Close</span></div></div><button className="sv3-primary">Open Quotation <ArrowRight size={14}/></button></header>
  <div className="sv3-opportunity-workgrid"><main>
   <section className="sv3-panel"><h3>Close Plan</h3><div className="sv3-close-plan">{[["Technical approval","Done",CheckCircle2],["Commercial revision","In progress",FileText],["Decision meeting","26 Sep",CalendarClock],["PO expected","30 Sep",ShieldCheck]].map(([a,b,I],i)=><div key={a}><span className={i<1?"done":i===1?"active":""}><I size={14}/></span><div><b>{a}</b><small>{b}</small></div></div>)}</div></section>
   <section className="sv3-panel"><h3>Next Best Actions</h3>{["Send revised commercial offer","Confirm procurement timeline","Secure decision-maker meeting"].map((x,i)=><button className="sv3-next-action" key={x}><span>{i+1}</span><b>{x}</b><small>{["Today","Tomorrow","This week"][i]}</small></button>)}</section>
  </main><aside className="sv3-panel"><h3>Deal Blockers</h3>{[["Commercial approval delay","High"],["Competitor pressure","Medium"],["Procurement timing","Medium"]].map(([a,b])=><div className="sv3-blocker" key={a}><CircleAlert size={14}/><span>{a}</span><b>{b}</b></div>)}</aside></div>
 </section></SalesWorkspace>
}
