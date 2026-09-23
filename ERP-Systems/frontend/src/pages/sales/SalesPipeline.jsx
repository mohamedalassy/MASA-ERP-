import {Columns3, Filter, Layers3, MoveHorizontal, Search} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
import { opportunities, stages, money } from "./data/salesDemo";
import { Status } from "./components/SalesUI";

const extra = [
 {id:11,name:"Fire Alarm Upgrade",customer:"Afaq Facilities",value:142000,probability:44,stage:"Solution",health:"Watch",owner:"Ahmed",close:"18 Oct"},
 {id:12,name:"Smart Branch Rollout",customer:"Al Raya Development",value:224000,probability:35,stage:"Discovery",health:"Healthy",owner:"Mohamed",close:"25 Oct"},
 {id:13,name:"Data Center CCTV",customer:"Nova Medical",value:318000,probability:71,stage:"Quotation",health:"Healthy",owner:"Sara",close:"07 Oct"},
];
const all = [...opportunities,...extra];

export default function SalesPipeline({ onNavigate, activeView = "sales-pipeline" }) {
  return (
    <SalesWorkspace activeView={activeView} onNavigate={onNavigate}>
      <section className="sv2-page sv2-pipeline">
        <header className="sv2-pipeline-head">
          <div><span className="sv2-kicker">PIPELINE OPERATIONS BOARD</span><h1>Sales Pipeline</h1><p>Move deals through stages while protecting value and close velocity.</p></div>
          <div className="sv2-pipeline-tools">
            <div className="sv2-searchbox"><Search size={14}/><input placeholder="Search deals..."/></div>
            <button><Filter size={14}/> Filters</button>
            <button><Layers3 size={14}/> All owners</button>
          </div>
        </header>

        <div className="sv2-pipeline-strip">
          <div><span>Pipeline value</span><b>SAR 4.82M</b></div>
          <div><span>Weighted value</span><b>SAR 2.66M</b></div>
          <div><span>Open deals</span><b>48</b></div>
          <div><span>Avg probability</span><b>61%</b></div>
          <div className="hint"><MoveHorizontal size={15}/> Drag-ready stage design</div>
        </div>

        <div className="sv2-kanban-board">
          {stages.map((stage,si)=>(
            <section className="sv2-kanban-column" key={stage.name}>
              <header>
                <div><span className={"dot d"+si}/><b>{stage.name}</b><small>{stage.deals} deals</small></div>
                <strong>{money(stage.value)}</strong>
              </header>
              <div className="sv2-kanban-capacity"><i style={{width:`${45+si*10}%`}}/></div>
              <div className="sv2-kanban-cards">
                {all.filter(o=>o.stage===stage.name).map(o=>(
                  <article key={o.id} onClick={()=>onNavigate?.("sales-opportunity-details")}>
                    <div className="sv2-kanban-top"><span>{o.customer}</span><Status>{o.health}</Status></div>
                    <h3>{o.name}</h3>
                    <b className="sv2-kanban-value">{money(o.value)}</b>
                    <div className="sv2-prob-line"><i style={{width:`${o.probability}%`}}/><span>{o.probability}%</span></div>
                    <footer><span className="owner">{o.owner[0]}</span><span>{o.owner}</span><small>Close {o.close}</small></footer>
                  </article>
                ))}
                <button className="sv2-add-deal">+ Add deal</button>
              </div>
            </section>
          ))}
        </div>
      </section>
    </SalesWorkspace>
  );
}
