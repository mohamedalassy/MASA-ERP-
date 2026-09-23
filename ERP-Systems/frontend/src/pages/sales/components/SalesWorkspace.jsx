import SalesNav from "./SalesNav";
import "../styles/sales-premium.css";
export default function SalesWorkspace({activeView,onNavigate,children}){return <div className="ms-workspace"><SalesNav activeView={activeView} onNavigate={onNavigate}/>{children}</div>}
