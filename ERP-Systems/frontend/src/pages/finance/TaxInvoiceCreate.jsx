import { useCallback, useEffect, useMemo, useState } from "react";
import { FilePlus2, Plus, Trash2 } from "lucide-react";
import { API, FinancePageShell, money } from "./FinancePageShared";

const today=()=>new Date().toISOString().slice(0,10);
const line=()=>({description:"",item_code:"",unit:"",quantity:1,unit_price:0,discount_amount:0,tax_code_id:""});

export default function TaxInvoiceCreate({onChangeView,viewData={}}){
  const [profiles,setProfiles]=useState([]),[taxCodes,setTaxCodes]=useState([]),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const [form,setForm]=useState({invoice_type:"tax_invoice",document_type:"invoice",billing_type:"full",company_tax_profile_id:"",project_id:viewData.projectId||"",quotation_id:viewData.quotationId||"",buyer_name:"",buyer_vat_number:"",buyer_commercial_register:"",buyer_city:"",buyer_country_code:"SA",issue_date:today(),currency:"SAR",notes:"",items:[line()]});

  const load=useCallback(async()=>{try{const [a,b]=await Promise.all([fetch(`${API}/finance/tax-profiles`),fetch(`${API}/finance/tax-codes`)]);const aj=await a.json(),bj=await b.json();setProfiles(aj.data||[]);setTaxCodes(bj.data||[]);const def=(aj.data||[]).find(x=>x.is_default)||(aj.data||[])[0];if(def)setForm(f=>({...f,company_tax_profile_id:f.company_tax_profile_id||def.id}))}catch(e){setError("تعذر تحميل إعدادات الفاتورة.")}},[]);
  useEffect(()=>{load()},[load]);

  const setItem=(i,k,v)=>setForm(f=>({...f,items:f.items.map((x,n)=>n===i?{...x,[k]:v}:x)}));
  const total=useMemo(()=>form.items.reduce((s,x)=>s+(Number(x.quantity||0)*Number(x.unit_price||0)-Number(x.discount_amount||0)),0),[form.items]);

  const save=async(e)=>{e.preventDefault();try{setSaving(true);setError("");const payload={...form,company_tax_profile_id:Number(form.company_tax_profile_id),project_id:form.project_id?Number(form.project_id):null,quotation_id:form.quotation_id?Number(form.quotation_id):null,items:form.items.map((x,i)=>({...x,quantity:Number(x.quantity),unit_price:Number(x.unit_price),discount_amount:Number(x.discount_amount||0),tax_code_id:Number(x.tax_code_id),sort_order:i}))};const r=await fetch(`${API}/finance/tax-invoices`,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok||j.success===false)throw new Error(j.message||Object.values(j.errors||{}).flat().join(" ")||"تعذر إنشاء الفاتورة.");onChangeView?.("finance-tax-details",{taxInvoiceId:j.data.id})}catch(e){setError(e.message)}finally{setSaving(false)}};

  return <FinancePageShell icon={FilePlus2} title="إنشاء فاتورة ضريبية" description="إنشاء مسودة مالية قبل الإصدار والترحيل." loading={false} error={error}>
    <form onSubmit={save}>
      <section className="finx-card"><div className="finx-form-grid">
        <label>الملف الضريبي<select required value={form.company_tax_profile_id} onChange={e=>setForm({...form,company_tax_profile_id:e.target.value})}><option value="">اختر</option>{profiles.map(x=><option key={x.id} value={x.id}>{x.legal_name_ar||x.legal_name_en}</option>)}</select></label>
        <label>نوع الفاتورة<select value={form.invoice_type} onChange={e=>setForm({...form,invoice_type:e.target.value})}><option value="tax_invoice">فاتورة ضريبية</option><option value="simplified_tax_invoice">فاتورة مبسطة</option></select></label>
        <label>نوع المستند<select value={form.document_type} onChange={e=>setForm({...form,document_type:e.target.value})}><option value="invoice">فاتورة</option><option value="credit_note">إشعار دائن</option><option value="debit_note">إشعار مدين</option></select></label>
        <label>نوع الفوترة<select value={form.billing_type} onChange={e=>setForm({...form,billing_type:e.target.value})}><option value="full">كاملة</option><option value="partial">جزئية</option><option value="progress">مرحلية</option></select></label>
        <label>Project ID<input type="number" value={form.project_id} onChange={e=>setForm({...form,project_id:e.target.value})}/></label>
        <label>Quotation ID<input type="number" value={form.quotation_id} onChange={e=>setForm({...form,quotation_id:e.target.value})}/></label>
        <label>اسم المشتري<input required value={form.buyer_name} onChange={e=>setForm({...form,buyer_name:e.target.value})}/></label>
        <label>الرقم الضريبي للمشتري<input value={form.buyer_vat_number} onChange={e=>setForm({...form,buyer_vat_number:e.target.value})}/></label>
        <label>السجل التجاري<input value={form.buyer_commercial_register} onChange={e=>setForm({...form,buyer_commercial_register:e.target.value})}/></label>
        <label>المدينة<input value={form.buyer_city} onChange={e=>setForm({...form,buyer_city:e.target.value})}/></label>
        <label>تاريخ الإصدار<input required type="date" value={form.issue_date} onChange={e=>setForm({...form,issue_date:e.target.value})}/></label>
        <label>العملة<input required maxLength="3" value={form.currency} onChange={e=>setForm({...form,currency:e.target.value.toUpperCase()})}/></label>
      </div></section>
      <section className="finx-card"><div className="finx-card-head"><div className="finx-card-title"><h2>بنود الفاتورة</h2></div><button type="button" className="finx-btn finx-btn-soft" onClick={()=>setForm(f=>({...f,items:[...f.items,line()]}))}><Plus size={15}/> بند</button></div>
        <div className="finx-table-wrap"><table className="finx-table"><thead><tr><th>الوصف</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الضريبة</th><th></th></tr></thead><tbody>{form.items.map((x,i)=><tr key={i}><td><input required value={x.description} onChange={e=>setItem(i,"description",e.target.value)}/></td><td><input required type="number" min="0.0001" step="0.0001" value={x.quantity} onChange={e=>setItem(i,"quantity",e.target.value)}/></td><td><input required type="number" min="0" step="0.01" value={x.unit_price} onChange={e=>setItem(i,"unit_price",e.target.value)}/></td><td><input type="number" min="0" step="0.01" value={x.discount_amount} onChange={e=>setItem(i,"discount_amount",e.target.value)}/></td><td><select required value={x.tax_code_id} onChange={e=>setItem(i,"tax_code_id",e.target.value)}><option value="">اختر</option>{taxCodes.map(t=><option key={t.id} value={t.id}>{t.code} — {t.name} ({t.rate}%)</option>)}</select></td><td><button type="button" className="finx-btn finx-btn-soft" disabled={form.items.length===1} onClick={()=>setForm(f=>({...f,items:f.items.filter((_,n)=>n!==i)}))}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>
        <div className="finx-insight-strip"><div className="finx-insight"><div><span>الإجمالي قبل احتساب الضريبة</span><strong>{money(total)} ر.س</strong></div></div></div>
        <button className="finx-btn finx-btn-primary" disabled={saving} type="submit">{saving?"جارٍ الحفظ...":"حفظ كمسودة"}</button>
      </section>
    </form>
  </FinancePageShell>
}
