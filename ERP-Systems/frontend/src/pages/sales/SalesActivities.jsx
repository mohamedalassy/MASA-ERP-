import {CalendarDays, CheckCircle2, Clock3, ListFilter, Phone, Plus, Search, Video} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesActivities({onNavigate,activeView="sales-activities"}) {
 const days=["Mon 21","Tue 22","Wed 23","Thu 24","Fri 25"];
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>SALES EXECUTION</span><h1>Activities & Follow-ups</h1><p>Run the day from meetings, calls, tasks and overdue commitments.</p></div><button className="sv3-primary"><Plus size={15}/> New Activity</button></header>
  <div className="sv3-activity-strip"><div><b>24</b><span>Due Today</span></div><div><b>8</b><span>Overdue</span></div><div><b>31</b><span>Calls</span></div><div><b>14</b><span>Meetings</span></div><div><b>86%</b><span>Completion Rate</span></div></div>
  <div className="sv3-activity-layout">
    <section className="sv3-calendar">
      <div className="sv3-calendar-tools"><button><CalendarDays size={15}/> Week View</button><div className="sv3-search-lg"><Search size={15}/><input placeholder="Search activity..."/></div><button><ListFilter size={15}/> Filters</button></div>
      <div className="sv3-calendar-grid">
        {days.map((d,di)=><div className="sv3-day" key={d}><header><b>{d}</b><span>{[5,7,6,8,4][di]} items</span></header>
          {[0,1,2].map((n)=><article className={"type-"+((di+n)%3)} key={n}><small>{["09:30","11:00","14:30"][(di+n)%3]}</small><b>{["Discovery Call","Commercial Meeting","Quotation Follow-up"][(di+n)%3]}</b><span>{["Al Raya Development","Eastern Industrial Co.","Nova Medical"][(di+n)%3]}</span><footer>{(di+n)%3===0?<Phone size={12}/>:<Video size={12}/>} {["Ahmed","Sara","Mohamed"][(di+n)%3]}</footer></article>)}
        </div>)}
      </div>
    </section>
    <aside className="sv3-today-panel"><span className="sv3-kicker">TODAY / PRIORITY</span><h2>Your execution queue</h2>
      {["Call Eastern Industrial","Send revised quote","Confirm site visit","Collect PO copy"].map((x,i)=><div className="sv3-task" key={x}><span className={i<2?"urgent":""}>{i<2?<Clock3 size={14}/>:<CheckCircle2 size={14}/>}</span><div><b>{x}</b><small>{["10:30","12:00","14:00","16:30"][i]}</small></div></div>)}
    </aside>
  </div>
 </section></SalesWorkspace>
}
