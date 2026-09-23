import {ArrowUpRight, CalendarClock, ChevronRight, CircleAlert, Gauge, Plus, Sparkles, Target} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
import { opportunities, money } from "./data/salesDemo";
import { Status } from "./components/SalesUI";

export default function SalesOpportunities({ onNavigate, activeView = "sales-opportunities" }) {
  const hero = opportunities[0];
  return (
    <SalesWorkspace activeView={activeView} onNavigate={onNavigate}>
      <section className="sv2-page sv2-dealroom">
        <header className="sv2-simple-head">
          <div><span className="sv2-kicker">DEAL MANAGEMENT</span><h1>Opportunity Deal Room</h1><p>Focus the team on close probability, momentum and blockers.</p></div>
          <button className="sv2-primary"><Plus size={14}/> New Opportunity</button>
        </header>

        <div className="sv2-deal-hero">
          <div className="sv2-deal-hero-copy">
            <span className="eyebrow">TOP PRIORITY DEAL</span>
            <h2>{hero.name}</h2>
            <p>{hero.customer}</p>
            <div className="sv2-deal-hero-value"><b>{money(hero.value)}</b><span>expected close {hero.close}</span></div>
            <button onClick={()=>onNavigate?.("sales-opportunity-details")}>Open deal workspace <ChevronRight size={14}/></button>
          </div>
          <div className="sv2-probability-gauge">
            <div className="dial"><b>{hero.probability}%</b><span>win probability</span></div>
            <Status>{hero.health}</Status>
          </div>
          <div className="sv2-deal-signals">
            <div><Sparkles size={15}/><span>AI Health</span><b>87 / 100</b><small>Strong momentum</small></div>
            <div><Gauge size={15}/><span>Velocity</span><b>21 days</b><small>6 days faster</small></div>
            <div><CalendarClock size={15}/><span>Close Plan</span><b>4 / 5</b><small>milestones complete</small></div>
          </div>
        </div>

        <div className="sv2-opportunity-grid">
          <section className="sv2-panel">
            <div className="sv2-panel-head"><div><span>ACTIVE PORTFOLIO</span><h3>Deals by close priority</h3></div><Target size={18}/></div>
            <div className="sv2-deal-list">
              {opportunities.map(o=>(
                <button key={o.id} onClick={()=>onNavigate?.("sales-opportunity-details")}>
                  <div className="sv2-deal-avatar">{o.customer[0]}</div>
                  <div className="copy"><b>{o.name}</b><span>{o.customer} • {o.stage}</span></div>
                  <div className="value"><b>{money(o.value)}</b><span>{o.probability}% probability</span></div>
                  <Status>{o.health}</Status>
                  <ChevronRight size={15}/>
                </button>
              ))}
            </div>
          </section>

          <aside className="sv2-deal-side">
            <section className="sv2-panel sv2-close-calendar">
              <span>30-DAY CLOSE CALENDAR</span>
              <div className="sv2-calendar-strip">
                {["23","24","25","26","27","28","29","30"].map((d,i)=><div className={i===5?"active":""} key={d}><small>{["W","T","F","S","S","M","T","W"][i]}</small><b>{d}</b></div>)}
              </div>
              <div className="sv2-close-item"><i/><div><b>National Clinics Group</b><span>SAR 510K • Sep 28</span></div></div>
              <div className="sv2-close-item"><i/><div><b>Eastern Industrial Co.</b><span>SAR 380K • Sep 30</span></div></div>
            </section>

            <section className="sv2-panel sv2-blockers">
              <div className="sv2-panel-head"><div><span>DEAL BLOCKERS</span><h3>What could stop the close?</h3></div><CircleAlert size={18}/></div>
              <div><span>Commercial approval delay</span><b>High</b></div>
              <div><span>Competitor pressure</span><b>Medium</b></div>
              <div><span>Customer procurement timing</span><b>Medium</b></div>
            </section>
          </aside>
        </div>
      </section>
    </SalesWorkspace>
  );
}
