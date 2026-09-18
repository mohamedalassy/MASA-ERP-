
import { Plus } from "lucide-react";
import { SalesPageFrame, SalesPanel, SalesState, StatusPill } from "../../components/sales/SalesPageFrame";
import { useSalesApi } from "../../hooks/useSalesApi";
import { salesApi } from "../../lib/salesApi";
import { useSalesContext } from "../../context/SalesContext";

export default function SalesLeads({ onNavigate }) {
  const { branchId } = useSalesContext();
  const { data, loading, error, refresh } = useSalesApi("/sales/leads");
  const rows = Array.isArray(data) ? data : [];

  const addLead = async () => {
    const name = window.prompt("اسم العميل المحتمل");
    if (!name || !branchId) return;
    await salesApi.post("/sales/leads", { branch_id:Number(branchId), name, status:"new", priority:"normal" });
    refresh();
  };

  return <SalesPageFrame activeView="sales-leads" onNavigate={onNavigate} title="العملاء المحتملون"
    description="استقبال وتأهيل وتحويل Leads إلى فرص مبيعات."
    actions={<button className="sales-btn primary" onClick={addLead}><Plus size={15}/>Lead جديد</button>}>
    <SalesState loading={loading} error={error} empty={!rows.length}>
      <SalesPanel title="Lead Inbox" subtitle={`${rows.length} سجل`}>
        <div className="sales-table">
          <div className="sales-table-head cols-6"><span>Lead #</span><span>الاسم</span><span>الشركة</span><span>المصدر</span><span>الحالة</span><span>المسؤول</span></div>
          {rows.map(x=><div className="sales-table-row cols-6" key={x.id}>
            <strong>{x.lead_number}</strong><span>{x.name}</span><span>{x.company_name || "-"}</span><span>{x.source || "-"}</span>
            <StatusPill tone={x.status==="qualified"?"green":x.status==="disqualified"?"red":"blue"}>{x.status}</StatusPill><span>{x.owner?.name || "-"}</span>
          </div>)}
        </div>
      </SalesPanel>
    </SalesState>
  </SalesPageFrame>;
}
