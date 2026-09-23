import {ArrowRight, Building2, CheckCircle2, FileText, Mail, Phone, Sparkles, Target, UserCheck} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesLeadDetails({onNavigate}) {
 return <SalesWorkspace activeView="sales-leads" onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-record-hero"><div><span>LEAD WORKSPACE</span><h1>Al Raya Development</h1><p>Construction • Eastern Province • Referral</p></div><div className="sv3-record-score"><Sparkles size={17}/><b>92</b><span>AI Lead Score</span></div><button className="sv3-primary">Convert to Opportunity <ArrowRight size={14}/></button></header>
  <div className="sv3-record-grid"><main>
   <section className="sv3-panel"><h3>Qualification Canvas</h3><div className="sv3-qual-canvas">{[["Need","Confirmed",CheckCircle2],["Budget","Likely",Target],["Authority","Identified",UserCheck],["Company Fit","High",Building2]].map(([a,b,I])=><div key={a}><I size={17}/><span>{a}</span><b>{b}</b></div>)}</div></section>
   <section className="sv3-panel"><h3>Activity Timeline</h3><div className="sv3-record-timeline">{[["12:40","Qualification call completed",Phone],["13:05","Company profile shared",Mail],["14:20","Requirements document received",FileText]].map(([t,a,I])=><div key={t}><span>{t}</span><i><I size={13}/></i><b>{a}</b></div>)}</div></section>
  </main><aside className="sv3-panel"><h3>Account Intelligence</h3><div className="sv3-intel-score"><Sparkles size={19}/><b>High Intent</b><span>3 verified buying signals</span></div>{["New branch expansion detected","Hiring for security/IT roles","Recent tender activity"].map(x=><div className="sv3-intel-item" key={x}><CheckCircle2 size={14}/>{x}</div>)}</aside></div>
 </section></SalesWorkspace>
}
