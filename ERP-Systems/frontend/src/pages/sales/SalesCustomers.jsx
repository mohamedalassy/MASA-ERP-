import {Building2, ChevronRight, MapPin, Search, ShieldCheck, TrendingUp, UsersRound} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
import {customers, money} from "./data/salesDemo";
import {Status} from "./components/SalesUI";
export default function SalesCustomers({onNavigate,activeView="sales-customers"}) {
  return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}>
    <section className="sv3-page">
      <header className="sv3-head"><div><span>ACCOUNT PORTFOLIO</span><h1>Customers</h1><p>Revenue quality, relationship strength and account expansion in one portfolio view.</p></div><button className="sv3-primary">+ New Customer</button></header>
      <div className="sv3-customer-hero">
        <div><b>428</b><span>Active Accounts</span><small>+23 this quarter</small></div>
        <div><b>SAR 18.4M</b><span>Lifetime Revenue</span><small>+16.2% YoY</small></div>
        <div><b>31.4%</b><span>Avg Margin</span><small>+1.8 pts</small></div>
        <div><b>87%</b><span>Healthy Accounts</span><small>12 need attention</small></div>
      </div>
      <div className="sv3-customer-layout">
        <aside className="sv3-account-map">
          <div className="sv3-search-lg"><Search size={16}/><input placeholder="Search accounts..."/></div>
          <h3>Portfolio Segments</h3>
          {["Enterprise","Growth","Strategic","At Risk","New Accounts"].map((x,i)=><button key={x}><i className={"c"+i}/><span>{x}</span><b>{[64,118,37,12,29][i]}</b></button>)}
          <div className="sv3-map-card"><MapPin size={18}/><b>Eastern Province</b><span>46% of active portfolio</span></div>
        </aside>
        <main className="sv3-account-grid">
          {customers.map((c,i)=><article key={c.name} onClick={()=>onNavigate?.("sales-customer-360")}>
            <div className="sv3-account-card-top"><div className="sv3-logo-box">{c.name.slice(0,2).toUpperCase()}</div><div><h3>{c.name}</h3><span>{c.tier} • {c.city}</span></div><Status>{c.health}</Status></div>
            <div className="sv3-account-card-metrics"><div><span>Revenue</span><b>{money(c.revenue)}</b></div><div><span>Pipeline</span><b>{money(c.pipeline)}</b></div><div><span>Margin</span><b>{c.margin}%</b></div></div>
            <div className="sv3-account-card-foot"><span><UsersRound size={14}/> 4 contacts</span><span><TrendingUp size={14}/> 2 open deals</span><ChevronRight size={16}/></div>
          </article>)}
        </main>
      </div>
    </section>
  </SalesWorkspace>
}
