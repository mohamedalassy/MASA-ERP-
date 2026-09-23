import {Filter, Flame, Plus, Search, SlidersHorizontal, Sparkles, UserPlus, Zap} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
import { leads } from "./data/salesDemo";

export default function SalesLeads({ onNavigate, activeView = "sales-leads" }) {
  const selected = leads[0];
  return (
    <SalesWorkspace activeView={activeView} onNavigate={onNavigate}>
      <section className="sv2-page sv2-leads">
        <header className="sv2-simple-head">
          <div><span className="sv2-kicker">PROSPECTING WORKSPACE</span><h1>Lead Intelligence</h1><p>Prioritize accounts by fit, intent and sales readiness.</p></div>
          <button className="sv2-primary"><Plus size={14}/> New Lead</button>
        </header>

        <div className="sv2-lead-layout">
          <aside className="sv2-lead-sidebar">
            <div className="sv2-searchbox"><Search size={15}/><input placeholder="Search leads..."/></div>
            <div className="sv2-filter-title"><span>Smart Segments</span><SlidersHorizontal size={14}/></div>
            {[
              ["Hot prospects","92+",18,"hot"],
              ["High intent","Buying signals",31,"purple"],
              ["Follow-up today","Due tasks",24,"blue"],
              ["Stalled leads","No activity",9,"orange"],
              ["New this week","Fresh inbound",42,"green"],
            ].map(([a,b,c,t])=><button className="sv2-segment" key={a}><i className={t}/><div><b>{a}</b><span>{b}</span></div><strong>{c}</strong></button>)}
            <div className="sv2-source-card">
              <span>LEAD MIX</span>
              <div className="sv2-source-donut"><b>1,284</b><small>total leads</small></div>
              <ul><li><i/> Referral <b>34%</b></li><li><i/> Website <b>26%</b></li><li><i/> Campaign <b>21%</b></li></ul>
            </div>
          </aside>

          <main className="sv2-lead-stream">
            <div className="sv2-stream-head">
              <div><h3>Priority queue</h3><span>Sorted by AI lead score</span></div>
              <button><Filter size={14}/> Filters</button>
            </div>
            <div className="sv2-lead-cards">
              {leads.map((l,idx)=>(
                <button key={l.id} className={idx===0?"active":""} onClick={()=>onNavigate?.("sales-lead-details")}>
                  <div className={"sv2-score-ring "+(l.score>=80?"hot":"warm")}><b>{l.score}</b><span>score</span></div>
                  <div className="sv2-lead-company"><b>{l.company}</b><span>{l.industry} • {l.contact}</span><small>{l.source} • {l.last}</small></div>
                  <div className="sv2-signal-stack"><span><Zap size={11}/> intent</span><span><Flame size={11}/> fit</span></div>
                  <div className="sv2-lead-owner"><span>{l.owner[0]}</span><small>{l.owner}</small></div>
                  <div className="sv2-next-action"><b>{l.next}</b><small>Next action</small></div>
                </button>
              ))}
            </div>
          </main>

          <aside className="sv2-lead-preview">
            <div className="sv2-preview-top">
              <div className="sv2-company-mark">{selected.company[0]}</div>
              <span>HOT LEAD</span>
              <h2>{selected.company}</h2>
              <p>{selected.industry} • Eastern Province</p>
            </div>
            <div className="sv2-fit-score"><div><b>92</b><span>AI fit score</span></div><Sparkles size={20}/></div>
            <div className="sv2-preview-section"><span>WHY THIS LEAD</span><ul><li>New expansion signal detected</li><li>Matching low-current requirement</li><li>Decision-maker contact available</li></ul></div>
            <div className="sv2-preview-section"><span>QUALIFICATION</span><div className="sv2-qual-grid"><div><b>Need</b><strong>High</strong></div><div><b>Budget</b><strong>Likely</strong></div><div><b>Authority</b><strong>Known</strong></div><div><b>Timing</b><strong>Q4</strong></div></div></div>
            <button className="sv2-primary wide" onClick={()=>onNavigate?.("sales-lead-details")}><UserPlus size={14}/> Open Lead Workspace</button>
          </aside>
        </div>
      </section>
    </SalesWorkspace>
  );
}
