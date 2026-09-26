import {Shell,Btn,Kpi,Panel,Score,CompanyRows,uiIcons} from "./shared";
export default function AISalesDashboard({onNavigate,activeView="ai-sales"}){
 const I=uiIcons;
 return <Shell activeView={activeView} onNavigate={onNavigate} title="Sales Command Center" subtitle="Discover demand, prioritize the right accounts and grow revenue with AI."
 actions={<><Btn secondary>Sep 1 — Sep 18</Btn><Btn>All Regions</Btn></>}>
  <div className="ai-hero">
   <div><small>AI SALES INTELLIGENCE</small><h2>Turn Opportunities into Growth</h2><p>AI learns your ERP products and services, scans your target markets and prioritizes companies with the strongest buying signals.</p><div><button onClick={()=>onNavigate?.("ai-sales-discover")}>Discover New Leads →</button><button className="light" onClick={()=>onNavigate?.("ai-sales-opportunities")}>View Opportunities</button></div></div>
   <aside><I.Sparkles size={34}/><b>AI is working for you</b><span>Scanning 1,248 companies today...</span></aside>
  </div>
  <div className="kpi-grid"><Kpi type="leads" title="Total Leads" value="1,248" delta="12%" note="+132 this week"/><Kpi type="companies" title="Target Companies" value="842" delta="18%" note="+128 this week"/><Kpi type="opportunities" title="Opportunities" value="320" delta="24%" note="+62 this week"/><Kpi type="pipeline" title="Pipeline Value" value="SAR 12.8M" delta="28%" note="Expected Revenue"/><Kpi type="rate" title="Win Rate" value="28%" delta="6%" note="vs. last month"/></div>
  <div className="dash-3">
   <Panel title="Leads by Source" action="Last 30 days"><div className="donut-wrap"><div className="donut"><b>1,248</b><span>Total Leads</span></div><ul><li><i className="blue"/>Website <b>32%</b></li><li><i className="green"/>Tenders <b>24%</b></li><li><i className="orange"/>Cold Outreach <b>18%</b></li><li><i className="pink"/>Referrals <b>12%</b></li><li><i className="purple"/>Events <b>8%</b></li></ul></div></Panel>
   <Panel title="Pipeline by Stage" action="Count"><div className="funnel">{[["New","420",100],["Qualified","312",82],["Proposal","180",62],["Negotiation","95",43],["Won","62",28]].map((x,i)=><div key={x[0]}><i style={{width:x[2]+"%"}} className={"f"+i}/><span>{x[0]} <b>{x[1]}</b></span></div>)}</div></Panel>
   <Panel title="Leads by Region" action="Saudi Arabia"><div className="map-card"><div className="map-bg"><span className="bubble b1">286</span><span className="bubble b2">112</span><span className="bubble b3">198</span></div><div className="regions">{[["Riyadh",412,90],["Eastern Province",286,68],["Makkah",198,48],["Madinah",112,31],["Qassim",86,23]].map(x=><div key={x[0]}><span>{x[0]}</span><i><u style={{width:x[2]+"%"}}/></i><b>{x[1]}</b></div>)}</div></div></Panel>
  </div>
  <div className="dash-3 lower">
   <Panel title="AI Insights"><div className="insights">{[["High Potential","12 new companies match your ideal customer profile.", "good"],["Tender Alert","5 new tenders related to business solutions.", "warn"],["Competitor Activity","Increased activity detected in target accounts.","purple"],["Recommendation","Focus outreach on construction companies in Dammam.","blue"]].map(x=><div className="insight" key={x[0]}><span className={x[2]}><I.Sparkles size={17}/></span><div><b>{x[0]}</b><small>{x[1]}</small></div><time>2h</time></div>)}</div></Panel>
   <Panel title="Recent Leads"><CompanyRows/></Panel>
   <Panel title="Upcoming Follow-ups"><div className="follow-table">{[["Northstar Holdings","Send proposal","Today, 11:00","High"],["Horizon Group","Call decision maker","Today, 14:00","High"],["Future Ventures","Follow up email","Tomorrow, 10:00","Medium"],["Golden Group","Online meeting","Tomorrow, 15:00","Medium"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><span>{x[2]}</span><em className={x[3].toLowerCase()}>{x[3]}</em></div>)}</div></Panel>
  </div>
  <Panel title="Top Opportunities"><div className="op-table">{[["Enterprise Solution","Horizon Group","SAR 2,500,000","Proposal","70%"],["Business Solution","National Trading Group","SAR 1,800,000","Negotiation","60%"],["Service Package","Golden Group","SAR 1,200,000","Qualified","50%"],["Integrated Solution","Northstar Holdings","SAR 980,000","Proposal","65%"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><strong>{x[2]}</strong><em>{x[3]}</em><span>{x[4]}</span></div>)}</div></Panel>
 </Shell>
}