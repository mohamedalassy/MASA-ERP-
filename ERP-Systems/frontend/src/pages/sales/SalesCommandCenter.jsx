import {
  ArrowUpRight, BellRing, CalendarDays, ChevronRight, CircleDollarSign,
  Gauge, Plus, RefreshCw, ShieldCheck, Sparkles, Target, TrendingUp, UsersRound
} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
import { Status } from "./components/SalesUI";
import { opportunities, stages, money } from "./data/salesDemo";

const pulse = [24,29,27,34,39,36,48,52,57,54,66,72,78,83,88,94];

export default function SalesCommandCenter({ onNavigate, activeView = "sales" }) {
  return (
    <SalesWorkspace activeView={activeView} onNavigate={onNavigate}>
      <section className="sv2-page sv2-command">
        <header className="sv2-command-hero">
          <div className="sv2-command-title">
            <span className="sv2-kicker">MASA SALES / EXECUTIVE COCKPIT</span>
            <h1>Sales Command Center</h1>
            <p>One operating view for revenue, pipeline velocity, risk and team execution.</p>
          </div>
          <div className="sv2-command-actions">
            <button><CalendarDays size={14}/> This Month</button>
            <button><RefreshCw size={14}/> Refresh</button>
            <button className="primary" onClick={() => onNavigate?.("sales-leads")}><Plus size={14}/> New Lead</button>
          </div>

          <div className="sv2-hero-metrics">
            <article className="main">
              <div><span>Revenue Forecast</span><b>SAR 2.17M</b></div>
              <div className="sv2-forecast-ring"><strong>72%</strong><small>confidence</small></div>
              <footer><ArrowUpRight size={14}/> 9.8% vs last month</footer>
            </article>
            <article>
              <CircleDollarSign size={18}/>
              <span>Total Pipeline</span><b>SAR 4.82M</b><small>48 active deals</small>
            </article>
            <article>
              <Target size={18}/>
              <span>Win Rate</span><b>38.6%</b><small>+4.1 pts</small>
            </article>
            <article>
              <Gauge size={18}/>
              <span>Sales Velocity</span><b>31d</b><small>3 days faster</small>
            </article>
            <article>
              <UsersRound size={18}/>
              <span>Quota Attainment</span><b>84%</b><small>3 reps above plan</small>
            </article>
          </div>
        </header>

        <div className="sv2-command-grid">
          <section className="sv2-panel sv2-revenue-panel">
            <div className="sv2-panel-head">
              <div><span>REVENUE MOMENTUM</span><h3>Pipeline & forecast trajectory</h3></div>
              <div className="sv2-legend"><i/> Forecast <i className="soft"/> Pipeline</div>
            </div>
            <div className="sv2-big-number">SAR 6.99M <small>commercial coverage</small></div>
            <div className="sv2-pulse-chart">
              {pulse.map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}
              <span className="threshold">Q3 target</span>
            </div>
            <div className="sv2-axis"><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span></div>
          </section>

          <section className="sv2-panel sv2-stage-panel">
            <div className="sv2-panel-head"><div><span>PIPELINE FLOW</span><h3>Stage distribution</h3></div><TrendingUp size={18}/></div>
            <div className="sv2-stage-stack">
              {stages.map((s,i)=>(
                <div key={s.name}>
                  <div><b>{s.name}</b><span>{s.deals} deals</span></div>
                  <div className="bar"><i style={{width:`${34+i*13}%`}}/></div>
                  <strong>{money(s.value)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="sv2-panel sv2-intelligence-panel">
            <div className="sv2-ai-orb"><Sparkles size={18}/></div>
            <span>MASA SALES INTELLIGENCE</span>
            <h3>5 deals need executive attention</h3>
            <p>SAR 420K of weighted pipeline is showing declining engagement or delayed close signals.</p>
            <div className="sv2-ai-stats">
              <div><b>3</b><span>at risk</span></div>
              <div><b>6</b><span>renewals</span></div>
              <div><b>4</b><span>next actions</span></div>
            </div>
            <button>Open intelligence <ChevronRight size={14}/></button>
          </section>
        </div>

        <div className="sv2-command-bottom">
          <section className="sv2-panel">
            <div className="sv2-panel-head"><div><span>DEAL DESK</span><h3>Priority opportunities</h3></div><button className="link" onClick={()=>onNavigate?.("sales-opportunities")}>View all</button></div>
            <div className="sv2-deal-table">
              {opportunities.map((o,i)=>(
                <button key={o.id} onClick={()=>onNavigate?.("sales-opportunity-details")}>
                  <span className="rank">{String(i+1).padStart(2,"0")}</span>
                  <div><b>{o.name}</b><small>{o.customer}</small></div>
                  <strong>{money(o.value)}</strong>
                  <div className="prob">{o.probability}%</div>
                  <Status>{o.health}</Status>
                </button>
              ))}
            </div>
          </section>

          <section className="sv2-panel sv2-alert-panel">
            <div className="sv2-panel-head"><div><span>REVENUE PROTECTION</span><h3>Exceptions requiring action</h3></div><BellRing size={18}/></div>
            <div className="sv2-alerts">
              <div className="critical"><ShieldCheck size={16}/><div><b>Delivered, not invoiced</b><span>7 orders</span></div><strong>SAR 240K</strong></div>
              <div><ShieldCheck size={16}/><div><b>Overdue receivables</b><span>11 accounts</span></div><strong>SAR 310K</strong></div>
              <div><ShieldCheck size={16}/><div><b>Renewals inside 60 days</b><span>6 contracts</span></div><strong>SAR 90K</strong></div>
            </div>
          </section>
        </div>
      </section>
    </SalesWorkspace>
  );
}
