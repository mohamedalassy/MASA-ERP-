import {
  House, Compass, Building2, Handshake, FileSearch, MapPinned, Mail,
  ListChecks, ChartNoAxesCombined, Sparkles, Settings2
} from "lucide-react";
import "./ai-sales-nav.css";

const items = [
 ["ai-sales","Home",House],
 ["ai-sales-discover","Discover",Compass],
 ["ai-sales-companies","Companies",Building2],
 ["ai-sales-opportunities","Opportunities",Handshake],
 ["ai-sales-tenders","Tenders",FileSearch],
 ["ai-sales-map","Map",MapPinned],
 ["ai-sales-communications","Messages",Mail],
 ["ai-sales-tasks","Tasks",ListChecks],
 ["ai-sales-analytics","Reports",ChartNoAxesCombined],
 ["ai-sales-command","AI",Sparkles],
 ["ai-sales-settings","Settings",Settings2],
];

export default function AISalesNav({activeView,onNavigate}) {
 return <nav className="ai-icon-nav">
  {items.map(([id,label,Icon])=><button type="button" key={id}
   className={activeView===id?"active":""} onClick={()=>onNavigate?.(id)}>
   <span><Icon size={19}/></span><small>{label}</small>
  </button>)}
 </nav>;
}