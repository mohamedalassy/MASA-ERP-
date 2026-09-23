import {CircleDollarSign, MoveUpRight, PieChart, TrendingDown, TrendingUp} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesProfitability({onNavigate,activeView="sales-profitability"}) {
 const dots=[["Eastern Industrial",72,22,"high"],["National Clinics",84,35,"high"],["Gulf Logistics",46,68,"low"],["Al Noor",58,52,"mid"],["Afaq",34,74,"low"]];
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>MARGIN INTELLIGENCE</span><h1>Customer Profitability</h1><p>Balance revenue growth with margin quality and cost to serve.</p></div></header>
  <div className="sv3-profit-top"><div><CircleDollarSign size={18}/><span>Revenue</span><b>SAR 6.2M</b></div><div><PieChart size={18}/><span>Gross Profit</span><b>SAR 1.94M</b></div><div><TrendingUp size={18}/><span>Gross Margin</span><b>31.3%</b></div><div><TrendingDown size={18}/><span>Low Margin Accounts</span><b>8</b></div></div>
  <div className="sv3-scatter"><div className="q q1">High value / Low margin</div><div className="q q2">High value / High margin</div><div className="q q3">Low value / Low margin</div><div className="q q4">Low value / High margin</div>{dots.map(([n,x,y,t])=><button className={t} style={{left:`${x}%`,bottom:`${y}%`}} key={n}><span>{n}</span></button>)}<div className="x-label">Revenue →</div><div className="y-label">Margin →</div></div>
 </section></SalesWorkspace>
}
