import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Sparkles, SlidersHorizontal, X } from "lucide-react";
import { Shell, Btn, Kpi, Panel, Score } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

export default function DiscoveredLeads({ onNavigate, activeView = "ai-sales-discovered" }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);

  const getScore = (c) => Number(c?.score?.overall_score ?? c?.latest_score?.overall_score ?? c?.overall_score ?? c?.score?.overall ?? c?.score ?? 0);

  async function loadCompanies() {
    setLoading(true); setError("");
    try {
      const data = await aiSalesRequest("/companies?status=discovered&per_page=100");
      setCompanies(Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : Array.isArray(data?.companies) ? data.companies : []);
    } catch (e) { setError(e?.message || "Unable to load discovered companies."); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadCompanies(); }, []);

  const filtered = useMemo(() => {
    const term=search.trim().toLowerCase();
    return companies.filter(c => {
      const hay=[c.name,c.industry,c.category,c.city,c.region,c.country].filter(Boolean).join(" ").toLowerCase();
      return (!term || hay.includes(term)) && getScore(c)>=minScore;
    });
  }, [companies,search,minScore]);

  const qualified=companies.filter(c=>getScore(c)>=60).length;
  const hot=companies.filter(c=>getScore(c)>=85).length;

  function openCompany(company) {
    if (!company?.id) return;
    sessionStorage.setItem("ai-sales-selected-company", JSON.stringify(company));
    onNavigate?.("ai-sales-company");
  }

  return <Shell activeView={activeView} onNavigate={onNavigate} title="Discovered Leads" subtitle="Review AI discoveries, evidence, scores and recommended next actions.">
    <div className="mini-kpis">
      <Kpi type="leads" title="Discovered" value={companies.length} note="AI discovered companies"/>
      <Kpi type="companies" title="Qualified" value={qualified} note="Score ≥ 60"/>
      <Kpi type="opportunities" title="Hot Leads" value={hot} note="Score ≥ 85"/>
    </div>

    <Panel title="Lead Intelligence" action={<button type="button" className="ai-text-action" onClick={loadCompanies} disabled={loading}><RefreshCw size={13}/>{loading?"Refreshing...":"Refresh"}</button>}>
      <div className="ai-filter-toolbar">
        <div className="ai-search-field">
          <Search size={16}/>
          <input type="search" placeholder="Search companies, sectors or cities..." value={search} onChange={e=>setSearch(e.target.value)}/>
          {search && <button type="button" onClick={()=>setSearch("")} aria-label="Clear search"><X size={14}/></button>}
        </div>
        <div className="ai-select-field">
          <SlidersHorizontal size={15}/>
          <select value={minScore} onChange={e=>setMinScore(Number(e.target.value))}>
            <option value={0}>All Scores</option><option value={60}>Qualified ≥ 60</option><option value={75}>Strong ≥ 75</option><option value={85}>Hot ≥ 85</option>
          </select>
        </div>
        <Btn secondary onClick={loadCompanies} disabled={loading}><RefreshCw size={14}/>Refresh</Btn>
        <Btn onClick={()=>onNavigate?.("ai-sales-discover")}><Sparkles size={14}/>Discover More</Btn>
      </div>

      {error && <div className="ai-error">{error}</div>}

      {loading ? <div className="ai-table-skeleton">{[1,2,3,4,5].map(i=><i key={i}/>)}</div> :
       !filtered.length ? <div className="ai-empty-state"><Search size={22}/><strong>No discovered companies found</strong><span>Run AI Discovery or change the current filters.</span></div> :
       <div className="data-table ai-company-table">
         <div className="tr th"><span>Company</span><span>Industry</span><span>Location</span><span>AI Score</span><span>Status</span></div>
         {filtered.map(c=><div className="tr" key={c.id} role="button" tabIndex={0} onClick={()=>openCompany(c)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openCompany(c)}}}>
           <b>{c.name||"Unnamed Company"}</b><span>{c.industry||c.category||"—"}</span><span>{[c.city,c.region].filter(Boolean).join(", ")||"—"}</span><Score n={getScore(c)}/><span className="ai-status-chip">{c.status||"discovered"}</span>
         </div>)}
       </div>}
      {!loading && filtered.length>0 && <div className="ai-table-footer">Showing <b>{filtered.length}</b> of {companies.length} discovered companies</div>}
    </Panel>
  </Shell>;
}
