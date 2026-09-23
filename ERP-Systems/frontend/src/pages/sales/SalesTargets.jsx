import {Crown, Goal, Medal, TrendingUp, Trophy} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesTargets({onNavigate,activeView="sales-targets"}) {
 const reps=[["Ahmed","SAR 1.42M",108],["Mohamed","SAR 1.18M",94],["Sara","SAR 1.04M",91],["Khaled","SAR 890K",82]];
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>QUOTA & PERFORMANCE</span><h1>Sales Targets</h1><p>Align team execution to revenue goals and quota attainment.</p></div></header>
  <div className="sv3-target-hero"><div className="sv3-target-ring"><b>70%</b><span>Q3 attained</span></div><div><span>TEAM TARGET</span><b>SAR 7.0M</b><small>SAR 4.9M achieved • SAR 2.1M gap</small></div><div className="sv3-target-forecast"><TrendingUp size={18}/><span>Forecast finish</span><b>92%</b><small>of target</small></div></div>
  <div className="sv3-leaderboard"><header><Trophy size={18}/><h3>Sales Leaderboard</h3><span>Q3 2026</span></header>{reps.map(([n,v,p],i)=><div key={n}><span className={"rank r"+i}>{i===0?<Crown size={15}/>:i<3?<Medal size={14}/>:i+1}</span><div><b>{n}</b><small>{v} closed</small></div><div className="sv3-quota-bar"><i style={{width:`${Math.min(p,100)}%`}}/></div><strong>{p}%</strong></div>)}</div>
 </section></SalesWorkspace>
}
