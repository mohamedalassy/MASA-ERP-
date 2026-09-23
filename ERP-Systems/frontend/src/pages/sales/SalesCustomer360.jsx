import {Building2, CalendarDays, ChevronRight, CircleDollarSign, FileSignature, HeartPulse, Mail, MapPin, Phone, TrendingUp, UsersRound} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
import { opportunities, money } from "./data/salesDemo";
import { Status } from "./components/SalesUI";

export default function SalesCustomer360({ onNavigate, activeView = "sales-customer-360" }) {
  return (
    <SalesWorkspace activeView="sales-customers" onNavigate={onNavigate}>
      <section className="sv2-page sv2-customer360">
        <header className="sv2-account-hero">
          <div className="sv2-account-identity">
            <div className="sv2-account-logo">EI</div>
            <div>
              <span className="sv2-kicker">CUSTOMER 360 / ENTERPRISE ACCOUNT</span>
              <h1>Eastern Industrial Co.</h1>
              <p><MapPin size={12}/> Dammam, Eastern Province <i/> Active Customer</p>
            </div>
          </div>
          <div className="sv2-account-actions">
            <button><Mail size={14}/> Email</button>
            <button><Phone size={14}/> Call</button>
            <button className="primary">+ Opportunity</button>
          </div>

          <div className="sv2-account-health">
            <div className="sv2-health-ring"><b>87</b><span>health</span></div>
            <div><span>RELATIONSHIP HEALTH</span><b>Strong</b><small>Engagement improving</small></div>
          </div>

          <div className="sv2-account-metrics">
            <div><CircleDollarSign size={17}/><span>Lifetime Revenue</span><b>SAR 1.85M</b></div>
            <div><TrendingUp size={17}/><span>Open Pipeline</span><b>SAR 420K</b></div>
            <div><CircleDollarSign size={17}/><span>Outstanding</span><b>SAR 88K</b></div>
            <div><HeartPulse size={17}/><span>Profitability</span><b>31%</b></div>
            <div><FileSignature size={17}/><span>Contracts</span><b>3 Active</b></div>
          </div>
        </header>

        <nav className="sv2-account-tabs">
          {["Overview","Opportunities","Quotations","Orders","Invoices","Contracts","Activities","Contacts","Projects","Documents"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}
        </nav>

        <div className="sv2-account-grid">
          <main>
            <section className="sv2-panel sv2-account-timeline">
              <div className="sv2-panel-head"><div><span>ACCOUNT STORY</span><h3>Commercial relationship timeline</h3></div><CalendarDays size={18}/></div>
              <div className="sv2-timeline">
                {[
                  ["Today","Quotation revision shared","SAR 380K security upgrade"],
                  ["Yesterday","Commercial meeting completed","Decision expected this week"],
                  ["18 Sep","Site survey completed","Dammam plant"],
                  ["10 Sep","Opportunity created","Security modernization"],
                  ["01 Aug","Invoice collected","SAR 126K"],
                  ["15 Jul","Contract milestone completed","Phase 2 accepted"],
                ].map(([d,t,s],i)=><div key={i}><span className="date">{d}</span><i/><div><b>{t}</b><small>{s}</small></div></div>)}
              </div>
            </section>

            <section className="sv2-panel">
              <div className="sv2-panel-head"><div><span>OPEN BUSINESS</span><h3>Opportunities & commercial value</h3></div><button className="link">View all</button></div>
              <div className="sv2-account-opps">
                {opportunities.slice(0,3).map(o=><button key={o.id}><div><b>{o.name}</b><span>{o.stage}</span></div><strong>{money(o.value)}</strong><span className="pct">{o.probability}%</span><Status>{o.health}</Status><ChevronRight size={14}/></button>)}
              </div>
            </section>
          </main>

          <aside>
            <section className="sv2-panel sv2-key-contacts">
              <div className="sv2-panel-head"><div><span>RELATIONSHIP MAP</span><h3>Key contacts</h3></div><UsersRound size={18}/></div>
              {[
                ["AK","Ahmed Khalid","Procurement Director","Decision maker"],
                ["SA","Sara Al Amri","IT Manager","Technical champion"],
                ["MK","Mohamed Kareem","Finance Manager","Commercial approver"],
              ].map(([a,n,r,t])=><div className="sv2-contact" key={n}><span>{a}</span><div><b>{n}</b><small>{r}</small></div><em>{t}</em></div>)}
            </section>

            <section className="sv2-panel sv2-account-finance">
              <div className="sv2-panel-head"><div><span>FINANCIAL VIEW</span><h3>Exposure & collection</h3></div><Building2 size={18}/></div>
              <div className="sv2-finance-big"><b>SAR 88K</b><span>outstanding balance</span></div>
              <div className="sv2-aging-bars">
                <div><span>Current</span><i><b style={{width:"70%"}}/></i><strong>52K</strong></div>
                <div><span>1–30</span><i><b style={{width:"38%"}}/></i><strong>24K</strong></div>
                <div><span>31–60</span><i><b style={{width:"20%"}}/></i><strong>12K</strong></div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </SalesWorkspace>
  );
}
