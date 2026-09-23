import {Box, CheckCircle2, CircleDollarSign, PackageCheck, Truck, Warehouse} from "lucide-react";
import SalesWorkspace from "./components/SalesWorkspace";
export default function SalesOrders({onNavigate,activeView="sales-orders"}) {
 const rows=[["SO-2026-0821","Eastern Industrial Co.","SAR 380K",82,"Ready","Pending"],["SO-2026-0817","National Clinics Group","SAR 510K",61,"Partial","Partial"],["SO-2026-0809","Afaq Facilities","SAR 142K",100,"Delivered","Paid"]];
 return <SalesWorkspace activeView={activeView} onNavigate={onNavigate}><section className="sv3-page">
  <header className="sv3-head"><div><span>ORDER FULFILLMENT</span><h1>Sales Orders</h1><p>From confirmed order to reservation, delivery, invoicing and collection.</p></div></header>
  <div className="sv3-order-flow">{[[Box,"Confirmed","34"],[Warehouse,"Reserved","28"],[Truck,"In Delivery","12"],[PackageCheck,"Delivered","18"],[CircleDollarSign,"Invoiced","21"],[CheckCircle2,"Paid","16"]].map(([I,a,b],i)=><div key={a} className={i===2?"active":""}><I size={18}/><b>{b}</b><span>{a}</span></div>)}</div>
  <div className="sv3-orders-board">
   {rows.map(([n,c,v,p,d,pay])=><article key={n}><header><div><span>{n}</span><h3>{c}</h3></div><b>{v}</b></header><div className="sv3-fulfill"><div className="line"><i style={{width:`${p}%`}}/></div><strong>{p}% fulfilled</strong></div><div className="sv3-order-meta"><div><span>Stock</span><b>{p===100?"Released":"Reserved"}</b></div><div><span>Delivery</span><b>{d}</b></div><div><span>Invoice</span><b>{pay}</b></div></div></article>)}
  </div>
 </section></SalesWorkspace>
}
