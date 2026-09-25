import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { Shell, Btn, Kpi, Panel, Score } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

export default function Companies({ onNavigate, activeView="ai-sales-companies" }) {
  const [rows,setRows]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState("");
  const [search,setSearch]=useState(""), [minScore,setMinScore]=useState(0);

  const scoreOf=c=>Number(c?.latest_score?.overall_score ?? c?.score?.overall_score ?? c?.overall_score ?? c?.score ?? 0);

  async function load(){
    setLoading(true); setError("");
    try{
      const data=await aiSalesRequest("/companies?per_page=100");
      setRows(Array.isArray(data)?data:Array.isArray(data?.data)?data.data:Array.isArray(data?.companies)?data.companies:[]);
    }catch(e){setError(e?.message||"Unable to load companies.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{load()},[]);

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase();
    return rows.filter(c=>(!q||[c.name,c.industry,c.category,c.city,c.region,c.country].filter(Boolean).join(" ").toLowerCase().includes(q))&&scoreOf(c)>=minScore);
  },[rows,search,minScore]);

  const qualified=rows.filter(c=>scoreOf(c)>=60).length;
  const hot=rows.filter(c=>scoreOf(c)>=85).length;

  function open(c){ if(!c?.id)return; sessionStorage.setItem("ai-sales-selected-company",JSON.stringify(c)); onNavigate?.("ai-sales-company"); }

  return <Shell activeView={activeView} onNavigate={onNavigate} title="ذكاء الشركات" subtitle="مساحة عمل مباشرة للحسابات المستهدفة تشمل الإثراء والإشارات وسياق الفرص.">
    <div className="mini-kpis">
      <Kpi type="companies" title="الحسابات المستهدفة" value={rows.length} note="ملفات الشركات المباشرة"/>
      <Kpi type="leads" title="الحسابات المؤهلة" value={qualified} note="درجة الذكاء ≥ 60"/>
      <Kpi type="opportunities" title="نية شراء مرتفعة" value={hot} note="درجة الذكاء ≥ 85"/>
    </div>
    <Panel title="الشركات المستهدفة" action={<button type="button" className="ai-text-action" onClick={load} disabled={loading}><RefreshCw size={13}/>{loading?"جارٍ التحديث...":"تحديث"}</button>}>
      <div className="ai-filter-toolbar">
        <div className="ai-search-field"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم الشركة أو القطاع أو المدينة أو المنطقة..."/>{search&&<button type="button" onClick={()=>setSearch("")}><X size={14}/></button>}</div>
        <div className="ai-select-field"><SlidersHorizontal size={15}/><select value={minScore} onChange={e=>setMinScore(Number(e.target.value))}><option value="0">كل الدرجات</option><option value="60">Qualified ≥ 60</option><option value="75">Strong ≥ 75</option><option value="85">Hot ≥ 85</option></select></div>
        <Btn secondary onClick={load} disabled={loading}><RefreshCw size={14}/>تحديث</Btn>
      </div>
      {error&&<div className="ai-error">{error}</div>}
      {loading?<div className="ai-table-skeleton">{[1,2,3,4,5].map(i=><i key={i}/>)}</div>:!filtered.length?<div className="ai-empty-state"><Building2 size={23}/><strong>No companies match the current filters</strong><span>Change the filters or run AI Discovery to add more accounts.</span></div>:
      <div className="data-table ai-company-table">
        <div className="tr th"><span>الشركة</span><span>القطاع</span><span>الموقع</span><span>درجة الذكاء</span><span>الحالة</span></div>
        {filtered.map(c=><div className="tr" key={c.id} role="button" tabIndex={0} onClick={()=>open(c)} onKeyDown={e=>{if(e.key==="Enter"){open(c)}}}>
          <b className="ai-company-name"><span><Building2 size={13}/></span>{c.name||"شركة بدون اسم"}</b>
          <span>{c.industry||c.category||"—"}</span>
          <span className="ai-location-cell"><MapPin size={12}/>{[c.city,c.region].filter(Boolean).join(", ")||"—"}</span>
          <Score n={scoreOf(c)}/><span className="ai-status-chip">{c.status||"active"}</span>
        </div>)}
      </div>}
      {!loading&&filtered.length>0&&<div className="ai-table-footer">Showing <b>{filtered.length}</b> of {rows.length} companies</div>}
    </Panel>
  </Shell>;
}
