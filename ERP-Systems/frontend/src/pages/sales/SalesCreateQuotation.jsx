
import { SalesPageFrame, SalesPanel } from "../../components/sales/SalesPageFrame";
export default function SalesCreateQuotation({onNavigate}) {
 return <SalesPageFrame activeView="sales-quotations" onNavigate={onNavigate} title="إنشاء عرض سعر" description="يتم استخدام محرر التسعير الحالي حتى لا نكرر منطق التسعير.">
 <SalesPanel title="Advanced Pricing Builder"><p>محرر التسعير الحالي هو المصدر الرئيسي لإنشاء عروض الأسعار.</p><button className="sales-btn primary" onClick={()=>onNavigate?.("pricing-builder")}>فتح محرر التسعير</button></SalesPanel>
 </SalesPageFrame>
}
