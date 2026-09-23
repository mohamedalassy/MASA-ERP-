import {BarChart3, Download, LineChart, PieChart, Table2} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesReports({onNavigate,activeView="sales-reports"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>SALES ANALYTICS</span><h1>Reports</h1><p>Executive BI workspace for revenue, pipeline and conversion performance.</p></div><button className="sv3-primary"><Download size={14}/> Export</button></header>
  <div className="sv3-report-toolbar">{["Revenue","Pipeline","Conversion","Team","Customers"].map((x,i)=><button className={i===0?"active":""} key={x}>{x}</button>)}</div>
  <div className="sv3-bi-grid">
   <article className="wide"><header><LineChart size={17}/><h3>Revenue Trend</h3></header><div className="sv3-bi-bars">{[38,44,52,61,58,69,77,82,88,96].map((v,i)=><i key={i} style={{height:`${v}%`}}/>)}</div></article>
   <article><header><PieChart size={17}/><h3>Revenue Mix</h3></header><div className="sv3-bi-donut"><b>6.2M</b><span>Total</span></div></article>
   <article><header><BarChart3 size={17}/><h3>Win Rate</h3></header><div className="sv3-big-kpi">38.6%<small>+4.1 pts</small></div></article>
   <article className="wide"><header><Table2 size={17}/><h3>Top Customers</h3></header><div className="sv3-report-table">{["National Clinics","Eastern Industrial","Al Noor","Gulf Logistics"].map((x,i)=><div key={x}><span>{i+1}</span><b>{x}</b><strong>{["SAR 2.32M","SAR 1.85M","SAR 940K","SAR 710K"][i]}</strong></div>)}</div></article>
  </div>
 </section></SalesWorkspace>
}
