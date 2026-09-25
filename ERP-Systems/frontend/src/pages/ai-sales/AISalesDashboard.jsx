import {Shell,Btn,Kpi,Panel,Score,CompanyRows,uiIcons} from "./shared";
export default function AISalesDashboard({onNavigate,activeView="ai-sales"}){
 const I=uiIcons;
 return <Shell activeView={activeView} onNavigate={onNavigate} title="مركز قيادة المبيعات" subtitle="اكتشف الطلب ورتّب الحسابات المناسبة حسب الأولوية ونمِّ الإيرادات بالذكاء الاصطناعي."
 actions={<><Btn secondary>Sep 1 — Sep 18</Btn><Btn>All Regions</Btn></>}>
  <div className="ai-hero">
   <div><small>AI SALES INTELLIGENCE</small><h2>Turn Opportunities into Growth</h2><p>AI learns your ERP products and services, scans your target markets and prioritizes companies with the strongest buying signals.</p><div><button onClick={()=>onNavigate?.("ai-sales-discover")}>Discover New Leads →</button><button className="light" onClick={()=>onNavigate?.("ai-sales-opportunities")}>View Opportunities</button></div></div>
   <aside><I.Sparkles size={34}/><b>AI is working for you</b><span>Scanning 1,248 companies today...</span></aside>
  </div>
  <div className="kpi-grid"><Kpi type="leads" title="إجمالي العملاء المحتملين" value="1,248" delta="12%" note="+132 this week"/><Kpi type="companies" title="الشركات المستهدفة" value="842" delta="18%" note="+128 this week"/><Kpi type="opportunities" title="الفرص" value="320" delta="24%" note="+62 this week"/><Kpi type="pipeline" title="قيمة مسار المبيعات" value="SAR 12.8M" delta="28%" note="الإيراد المتوقع"/><Kpi type="rate" title="معدل الفوز" value="28%" delta="6%" note="مقارنة بالشهر الماضي"/></div>
  <div className="dash-3">
   <Panel title="العملاء حسب المصدر" action="آخر 30 يومًا"><div className="donut-wrap"><div className="donut"><b>1,248</b><span>إجمالي العملاء المحتملين</span></div><ul><li><i className="blue"/>Website <b>32%</b></li><li><i className="green"/>Tenders <b>24%</b></li><li><i className="orange"/>Cold Outreach <b>18%</b></li><li><i className="pink"/>Referrals <b>12%</b></li><li><i className="purple"/>Events <b>8%</b></li></ul></div></Panel>
   <Panel title="مسار المبيعات حسب المرحلة" action="العدد"><div className="funnel">{[["جديد","420",100],["مؤهل","312",82],["عرض","180",62],["تفاوض","95",43],["فائز","62",28]].map((x,i)=><div key={x[0]}><i style={{width:x[2]+"%"}} className={"f"+i}/><span>{x[0]} <b>{x[1]}</b></span></div>)}</div></Panel>
   <Panel title="العملاء حسب المنطقة" action="المملكة العربية السعودية"><div className="map-card"><div className="map-bg"><span className="bubble b1">286</span><span className="bubble b2">112</span><span className="bubble b3">198</span></div><div className="regions">{[["الرياض",412,90],["المنطقة الشرقية",286,68],["مكة المكرمة",198,48],["المدينة المنورة",112,31],["القصيم",86,23]].map(x=><div key={x[0]}><span>{x[0]}</span><i><u style={{width:x[2]+"%"}}/></i><b>{x[1]}</b></div>)}</div></div></Panel>
  </div>
  <div className="dash-3 lower">
   <Panel title="رؤى الذكاء الاصطناعي"><div className="insights">{[["إمكانات مرتفعة","12 new companies match your ideal customer profile.", "good"],["تنبيه منافسة","5 new tenders related to business solutions.", "warn"],["نشاط المنافسين","Increased activity detected in target accounts.","purple"],["توصية","Focus outreach on construction companies in Dammam.","blue"]].map(x=><div className="insight" key={x[0]}><span className={x[2]}><I.Sparkles size={17}/></span><div><b>{x[0]}</b><small>{x[1]}</small></div><time>2h</time></div>)}</div></Panel>
   <Panel title="أحدث العملاء المحتملين"><CompanyRows/></Panel>
   <Panel title="المتابعات القادمة"><div className="follow-table">{[["Northstar Holdings","إرسال العرض","Today, 11:00","مرتفع"],["Horizon Group","الاتصال بصاحب القرار","Today, 14:00","مرتفع"],["Future Ventures","متابعة بالبريد","Tomorrow, 10:00","متوسط"],["Golden Group","اجتماع عبر الإنترنت","Tomorrow, 15:00","متوسط"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><span>{x[2]}</span><em className={x[3].toLowerCase()}>{x[3]}</em></div>)}</div></Panel>
  </div>
  <Panel title="أهم الفرص"><div className="op-table">{[["Enterprise Solution","Horizon Group","SAR 2,500,000","عرض","70%"],["Business Solution","National Trading Group","SAR 1,800,000","تفاوض","60%"],["Service Package","Golden Group","SAR 1,200,000","مؤهل","50%"],["Integrated Solution","Northstar Holdings","SAR 980,000","عرض","65%"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><strong>{x[2]}</strong><em>{x[3]}</em><span>{x[4]}</span></div>)}</div></Panel>
 </Shell>
}