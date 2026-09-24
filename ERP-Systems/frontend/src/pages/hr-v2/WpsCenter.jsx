import{useCallback,useEffect,useState}from"react";
import{Banknote,FileCheck2,RefreshCw}from"lucide-react";
import{hrGet,hrPost}from"./hrApi";
import"./hr-v2.css";import"./hr-v2-stage4.css";
export default function WpsCenter(){
 const[rows,setRows]=useState([]),[err,setErr]=useState(""),[busy,setBusy]=useState("");
 const load=useCallback(()=>hrGet("/hr/v2/wps/batches").then(x=>setRows(x.data||[])).catch(e=>setErr(e.message)),[]);
 useEffect(()=>{load()},[load]);
 async function generate(id){try{setBusy(String(id));setErr("");await hrPost("/hr/v2/wps/generate",{payroll_run_id:id});await load()}catch(e){setErr(e.message)}finally{setBusy("")}}
 return <section className="pv2-page" dir="rtl"><header className="pv2-hero"><div><small>WAGE PROTECTION</small><h1>WPS Center</h1><p>نفس تشغيل الرواتب المعتمد هو مصدر بيانات حماية الأجور.</p></div><Banknote size={36}/></header>
 {err&&<div className="pv2-error">{err}</div>}
 <article className="pv2-panel">{rows.length?rows.map(x=><div className="gov-row" key={x.id}><FileCheck2 size={16}/><b>{x.batch_number}</b><span>{x.salary_month}</span><span>{x.lines_count} موظف</span><span>{Number(x.total_net||0).toLocaleString()} SAR</span><span className={"status "+x.status}>{x.status}</span><button disabled={busy===String(x.id)} onClick={()=>generate(x.id)}>{busy===String(x.id)?<RefreshCw size={15}/>:"Generate"}</button></div>):<p>لا توجد تشغيلات جاهزة لـ WPS حتى الآن.</p>}</article></section>
}
