import {BarChart3, ChevronRight, LineChart, Target, TrendingUp} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesForecast({onNavigate,activeView="sales-forecast"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>REVENUE FORECASTING</span><h1>Forecast</h1><p>Committed, likely and upside revenue against target.</p></div></header>
  <div className="sv3-forecast-hero"><div><Target size={19}/><span>Quarter Target</span><b>SAR 7.0M</b></div><div><TrendingUp size={19}/><span>Best Case</span><b>SAR 6.2M</b></div><div><LineChart size={19}/><span>Forecast Accuracy</span><b>91%</b></div></div>
  <div className="sv3-waterfall">
    <h3>Forecast Composition</h3>
    <div className="sv3-waterfall-bars"><div className="commit" style={{height:"86%"}}><span>Committed</span><b>SAR 3.8M</b></div><div className="likely" style={{height:"57%"}}><span>Likely</span><b>SAR 1.5M</b></div><div className="upside" style={{height:"38%"}}><span>Upside</span><b>SAR 900K</b></div><div className="gap" style={{height:"31%"}}><span>Gap</span><b>SAR 800K</b></div></div>
  </div>
  <div className="sv3-forecast-splits">{["By Branch","By Salesperson","By Stage","By Product"].map((x,i)=><button key={x}><BarChart3 size={16}/><div><b>{x}</b><span>{["Eastern 46%","Ahmed 24%","Negotiation 33%","Security 41%"][i]}</span></div><ChevronRight size={15}/></button>)}</div>
 </section></SalesWorkspace>
}
