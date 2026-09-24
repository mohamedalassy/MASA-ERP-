import{useCallback,useEffect,useState}from"react";
import{WalletCards,Plus,Calculator,CheckCircle2,RefreshCw,Send,FileCheck2}from"lucide-react";
import{hrGet,hrPost}from"./hrApi";
import"./hr-v2.css";import"./hr-v2-stage3.css";

export default function PayrollCommandCenter(){
 const[runs,setRuns]=useState([]),[summary,setSummary]=useState({}),[open,setOpen]=useState(false);
 const[form,setForm]=useState({year:new Date().getFullYear(),month:new Date().getMonth()+1,branch_id:""});
 const[err,setErr]=useState(""),[busy,setBusy]=useState("");

 const load=useCallback(async()=>{try{setErr("");const x=await hrGet("/hr/v2/payroll/runs");setRuns(x.data||[]);setSummary(x.summary||{})}catch(e){setErr(e.message)}},[]);
 useEffect(()=>{load()},[load]);

 async function act(id,action,data={}){try{setBusy(`${id}-${action}`);setErr("");await hrPost(`/hr/v2/payroll/runs/${id}/${action}`,data);await load()}catch(e){setErr(e.message)}finally{setBusy("")}}
 async function create(){try{setBusy("create");setErr("");await hrPost("/hr/v2/payroll/runs",{year:Number(form.year),month:Number(form.month),branch_id:form.branch_id?Number(form.branch_id):null});setOpen(false);await load()}catch(e){setErr(e.message)}finally{setBusy("")}}

 return <section className="pv2-page" dir="rtl">
  <header className="pv2-hero"><div><small>PAYROLL & COMPENSATION</small><h1>Payroll Command Center</h1><p>الحساب، المراجعة، الاعتماد، الترحيل وWPS من تشغيل رواتب واحد.</p></div><button onClick={()=>setOpen(!open)}><Plus size={16}/>تشغيل رواتب</button></header>
  {err&&<div className="pv2-error">{err}</div>}
  {open&&<div className="pay-form"><input type="number" value={form.year} onChange={e=>setForm({...form,year:e.target.value})}/><select value={form.month} onChange={e=>setForm({...form,month:e.target.value})}>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select><input placeholder="Branch ID اختياري" value={form.branch_id} onChange={e=>setForm({...form,branch_id:e.target.value})}/><button disabled={busy==="create"} onClick={create}>حساب وإنشاء</button></div>}
  <div className="pay-summary"><div><WalletCards/><small>الدورات</small><b>{summary.runs_count??runs.length}</b></div><div><Calculator/><small>بانتظار الإجراء</small><b>{runs.filter(x=>["calculated","approved"].includes(x.status)).length}</b></div><div><CheckCircle2/><small>مرحّلة</small><b>{summary.posted_count??0}</b></div></div>
  <article className="pv2-panel"><h2>دورات الرواتب</h2>{runs.map(x=><div className="pay-row" key={x.id}>
   <div><b>{x.run_number}</b><small>{String(x.period_month).padStart(2,"0")}/{x.period_year}</small></div>
   <span>{x.employees_count} موظف</span><span>{Number(x.total_gross||0).toLocaleString()} SAR</span><span>{Number(x.total_net||0).toLocaleString()} SAR</span><span className={"status "+x.status}>{x.status}</span>
   <div className="pay-actions">
    {x.status==="calculated"&&<><button disabled={busy} onClick={()=>act(x.id,"recalculate")} title="إعادة الحساب"><RefreshCw size={15}/></button><button disabled={busy} onClick={()=>act(x.id,"approve")} title="اعتماد"><CheckCircle2 size={15}/></button></>}
    {x.status==="approved"&&<><button disabled={busy} onClick={()=>act(x.id,"post")} title="ترحيل للمالية"><Send size={15}/></button><button disabled={busy} onClick={()=>act(x.id,"wps/validate")} title="فحص WPS"><FileCheck2 size={15}/></button></>}
    {["approved","posted"].includes(x.status)&&<button disabled={busy} onClick={()=>act(x.id,"wps/generate")} title="توليد WPS">WPS</button>}
   </div>
  </div>)}</article>
 </section>
}
