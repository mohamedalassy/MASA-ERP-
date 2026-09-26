import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Shell, Btn, Panel } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

export default function SalesPlaybooks({onNavigate,activeView="ai-sales-playbooks"}) {
  const [rows,setRows]=useState([]),[error,setError]=useState("");
  const [form,setForm]=useState({name:"",trigger_type:"signal",description:"",steps:"Discover\nQualify\nContact\nFollow up",is_active:true});
  const load=()=>aiSalesRequest("/playbooks").then(r=>setRows(r?.data||r||[])).catch(e=>setError(e?.message||"Unable to load playbooks."));
  useEffect(()=>{load()},[]);
  const save=async e=>{
    e.preventDefault(); setError("");
    try{
      await aiSalesRequest("/playbooks",{method:"POST",body:JSON.stringify({
        ...form,steps:form.steps.split("\n").map((x,i)=>({order:i+1,title:x.trim()})).filter(x=>x.title)
      })});
      setForm({...form,name:"",description:""}); await load();
    }catch(x){setError(x?.message||"Unable to create playbook.");}
  };
  return <Shell activeView={activeView} onNavigate={onNavigate} title="Sales Playbooks"
    subtitle="Reusable workflows stored in AI Sales instead of hard-coded demo cards.">
    {error&&<div className="ai-error">{error}</div>}
    <div className="workspace-2">
      <Panel title="Playbooks" action={<Btn secondary onClick={load}><RefreshCw size={14}/> Refresh</Btn>}>
        <div className="playbook-grid">{rows.length?rows.map((x,i)=><article key={x.id}>
          <span>{String(i+1).padStart(2,"0")}</span><h3>{x.name}</h3><p>{x.description||"No description"}</p>
          <small>{(x.steps||[]).length} steps • {x.trigger_type||"manual"} • {x.is_active?"Active":"Inactive"}</small>
        </article>):<p>No playbooks yet.</p>}</div>
      </Panel>
      <Panel title="New Playbook"><form className="pro-form" onSubmit={save}>
        <label>Name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <label>Trigger Type</label><input value={form.trigger_type} onChange={e=>setForm({...form,trigger_type:e.target.value})}/>
        <label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <label>Steps — one per line</label><textarea rows="7" value={form.steps} onChange={e=>setForm({...form,steps:e.target.value})}/>
        <Btn type="submit">
  <Plus size={14} />
  Create Playbook
</Btn>
      </form></Panel>
    </div>
  </Shell>;
}