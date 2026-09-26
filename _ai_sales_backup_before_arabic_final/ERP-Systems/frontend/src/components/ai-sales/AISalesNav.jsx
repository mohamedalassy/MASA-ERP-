import {
  House, Compass, Building2, UsersRound, Handshake, FileSearch,
  MapPinned, RadioTower, Mail, ListChecks, ChartNoAxesCombined,
  Sparkles, Settings2,
} from "lucide-react";
import "./ai-sales-nav.css";

const items = [
  ["ai-sales", "الرئيسية", House],
  ["ai-sales-discover", "اكتشاف", Compass],
  ["ai-sales-companies", "الشركات", Building2],
  ["ai-sales-leads", "العملاء المحتملون", UsersRound],
  ["ai-sales-opportunities", "الفرص", Handshake],
  ["ai-sales-tenders", "المنافسات", FileSearch],
  ["ai-sales-map", "الخريطة", MapPinned],
  ["ai-sales-signals", "الإشارات", RadioTower],
  ["ai-sales-communications", "الرسائل", Mail],
  ["ai-sales-tasks", "المهام", ListChecks],
  ["ai-sales-analytics", "التقارير", ChartNoAxesCombined],
  ["ai-sales-command", "الذكاء", Sparkles],
  ["ai-sales-settings", "الإعدادات", Settings2],
];

export default function AISalesNav({activeView,onNavigate,onChangeView}) {
  const handleNavigate=(id)=>{
    if(onNavigate){onNavigate(id);return;}
    onChangeView?.(id);
  };
  return (
    <nav className="ai-icon-nav" dir="rtl">
      {items.map(([id,label,Icon])=>(
        <button type="button" key={id} className={activeView===id?"active":""} onClick={()=>handleNavigate(id)}>
          <span><Icon size={19}/></span><small>{label}</small>
        </button>
      ))}
    </nav>
  );
}
