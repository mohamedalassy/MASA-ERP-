import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Shell, Btn, Kpi, Panel } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

export default function TasksFollowups({onNavigate,activeView="ai-sales-tasks"}) {
  const [tasks,setTasks]=useState([]),[companies,setCompanies]=useState([]),[error,setError]=useState("");
  const [form,setForm]=useState({company_id:"",title:"",type:"follow_up",priority:"medium",status:"open",due_at:""});

  const load=async()=>{
    try{
      const [t,c]=await Promise.all([aiSalesRequest("/tasks"),aiSalesRequest("/companies")]);
      setTasks(t?.data||t||[]); setCompanies(c?.data||c||[]);
    }catch(e){setError(e?.message||"Unable to load tasks.");}
  };
  useEffect(()=>{load()},[]);

  const stats=useMemo(()=>({
    open:tasks.filter(x=>x.status==="open").length,
    high:tasks.filter(x=>["high","urgent"].includes(x.priority)).length,
    done:tasks.filter(x=>x.status==="done").length,
  }),[tasks]);

  const save=async e=>{
    e.preventDefault(); setError("");
    try{
      await aiSalesRequest("/tasks",{method:"POST",body:JSON.stringify({
        ...form,company_id:form.company_id||null,due_at:form.due_at||null
      })});
      setForm({company_id:"",title:"",type:"follow_up",priority:"medium",status:"open",due_at:""});
      await load();
    }catch(x){setError(x?.message||"Unable to create task.");}
  };

  return <Shell activeView={activeView} onNavigate={onNavigate}
    title="Tasks & Follow-ups" subtitle="Real work queue connected to AI Sales accounts.">
    {error&&<div className="ai-error">{error}</div>}
    <div className="mini-kpis">
      <Kpi type="leads" title="Open" value={stats.open}/>
      <Kpi type="opportunities" title="High Priority" value={stats.high}/>
      <Kpi type="rate" title="Completed" value={stats.done}/>
    </div>
    <div className="workspace-2">
      <Panel title="Work Queue" action={<Btn secondary onClick={load}><RefreshCw size={14}/> Refresh</Btn>}>
        {tasks.length?tasks.map(x=><div className="task-row" key={x.id}>
          <button>✓</button><div><b>{x.title}</b><small>{x.company?.name||x.type||"Task"}</small></div>
          <span>{x.due_at?new Date(x.due_at).toLocaleString():"No due date"}</span>
          <em className={x.priority}>{x.priority||"medium"}</em>
        </div>):<p>No tasks yet.</p>}
      </Panel>
      <Panel title="New Task"><form className="pro-form" onSubmit={save}>
        <label>Company</label><select value={form.company_id} onChange={e=>setForm({...form,company_id:e.target.value})}>
          <option value="">No company</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label>Title</label><input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
        <label>Type</label><input value={form.type} onChange={e=>setForm({...form,type:e.target.value})}/>
        <label>Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
        </select>
        <label>Due At</label><input type="datetime-local" value={form.due_at} onChange={e=>setForm({...form,due_at:e.target.value})}/>
        <Btn type="submit">
  <Plus size={14} />
  Create Task
</Btn>
      </form></Panel>
    </div>
  </Shell>;
}