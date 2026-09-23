import {BadgeDollarSign, CheckCircle2, Clock3, WalletCards} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesCommissions({onNavigate,activeView="sales-commissions"}) {
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>SALES COMPENSATION</span><h1>Commissions</h1><p>Transparent commission accruals tied to performance and collection.</p></div></header>
  <div className="sv3-commission-wallet"><div><WalletCards size={22}/><span>Total Accrued</span><b>SAR 184K</b><small>Q3 2026</small></div><div><CheckCircle2 size={18}/><span>Approved</span><b>SAR 126K</b></div><div><Clock3 size={18}/><span>Pending</span><b>SAR 42K</b></div><div><BadgeDollarSign size={18}/><span>Paid</span><b>SAR 116K</b></div></div>
  <div className="sv3-commission-table">{[["Ahmed","SAR 48K","SAR 34K","SAR 14K"],["Mohamed","SAR 42K","SAR 31K","SAR 11K"],["Sara","SAR 39K","SAR 28K","SAR 11K"],["Khaled","SAR 31K","SAR 22K","SAR 9K"]].map(r=><div key={r[0]}><span className="avatar">{r[0][0]}</span><b>{r[0]}</b><span>{r[1]} earned</span><strong>{r[2]} approved</strong><em>{r[3]} pending</em></div>)}</div>
 </section></SalesWorkspace>
}
