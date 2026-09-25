import {
  House,
  Compass,
  Building2,
  UsersRound,
  Handshake,
  FileSearch,
  MapPinned,
  RadioTower,
  Mail,
  ListChecks,
  ChartNoAxesCombined,
  Sparkles,
  Settings2,
} from "lucide-react";

import "./ai-sales-nav.css";

const items = [
  ["ai-sales", "Home", House],
  ["ai-sales-discover", "Discover", Compass],
  ["ai-sales-companies", "Companies", Building2],

  // AI-approved sales leads
  ["ai-sales-leads", "Leads", UsersRound],

  ["ai-sales-opportunities", "Opportunities", Handshake],
  ["ai-sales-tenders", "Tenders", FileSearch],
  ["ai-sales-map", "Map", MapPinned],

  // Real market buying signals
  ["ai-sales-signals", "Signals", RadioTower],

  ["ai-sales-communications", "Messages", Mail],
  ["ai-sales-tasks", "Tasks", ListChecks],
  ["ai-sales-analytics", "Reports", ChartNoAxesCombined],
  ["ai-sales-command", "AI", Sparkles],
  ["ai-sales-settings", "Settings", Settings2],
];

export default function AISalesNav({
  activeView,
  onNavigate,
  onChangeView,
}) {
  const handleNavigate = (id) => {
    if (onNavigate) {
      onNavigate(id);
      return;
    }

    if (onChangeView) {
      onChangeView(id);
    }
  };

  return (
    <nav className="ai-icon-nav">
      {items.map(([id, label, Icon]) => {
        const isActive = activeView === id;

        return (
          <button
            type="button"
            key={id}
            className={isActive ? "active" : ""}
            onClick={() => handleNavigate(id)}
          >
            <span>
              <Icon size={19} />
            </span>

            <small>{label}</small>
          </button>
        );
      })}
    </nav>
  );
}
