import {
  LayoutDashboard, Search, Inbox, Building2, BrainCircuit, Users, Target,
  MapPinned, Radar, BriefcaseBusiness, MessagesSquare, WandSparkles,
  ListChecks, BookOpenCheck, ChartNoAxesCombined, Bot, Settings
} from "lucide-react";
import "./ai-sales-nav.css";

export const AI_SALES_VIEWS = [
  ["ai-sales","نظرة عامة",LayoutDashboard],
  ["ai-sales-discover","اكتشاف العملاء",Search],
  ["ai-sales-discovered","العملاء المكتشفون",Inbox],
  ["ai-sales-companies","الشركات",Building2],
  ["ai-sales-analysis","تحليل AI",BrainCircuit],
  ["ai-sales-leads","Leads",Users],
  ["ai-sales-opportunities","الفرص",Target],
  ["ai-sales-map","الخريطة والمناطق",MapPinned],
  ["ai-sales-signals","Signals Radar",Radar],
  ["ai-sales-tenders","المناقصات والمشاريع",BriefcaseBusiness],
  ["ai-sales-communications","التواصل",MessagesSquare],
  ["ai-sales-message","AI Message Composer",WandSparkles],
  ["ai-sales-tasks","المهام والمتابعات",ListChecks],
  ["ai-sales-playbooks","Sales Playbooks",BookOpenCheck],
  ["ai-sales-analytics","التقارير والتحليلات",ChartNoAxesCombined],
  ["ai-sales-command","AI Command Center",Bot],
  ["ai-sales-settings","الإعدادات",Settings],
];

export default function AISalesNav({activeView,onNavigate}) {
 return <div className="ais-nav">
  <div className="ais-nav-title"><BrainCircuit size={18}/> MASA AI Sales</div>
  <div className="ais-nav-scroll">{AI_SALES_VIEWS.map(([id,label,Icon]) =>
   <button key={id} className={activeView===id?"active":""} onClick={()=>onNavigate?.(id)}>
    <Icon size={16}/><span>{label}</span>
   </button>)}</div>
 </div>;
}