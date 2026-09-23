import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { API, FinancePageShell, FinanceTable } from "./FinancePageShared";

const blank={customer_id:"",customer_code:"",legal_name_ar:"",legal_name_en:"",is_vat_registered:true,vat_number:"",commercial_register:"",building_number:"",street_name:"",district:"",city:"",postal_code:"",country_code:"SA",is_active:true};

export default function CustomerTaxProfiles(){
  const [rows,setRows]=useState([]),[form,setForm]=useState(blank),[editing,setEditing]=useState(null),[show,setShow]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=useCallback(async()=>{try{setLoading(true);setError("");const r=await fetch(`${API}/finance/customer-tax-profiles`);const j=await r.json();if(!r.ok||j.success===false)throw new Error(j.message||"تعذر تحميل بيانات العملاء الضريبية.");setRows(j.data||[])}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  useEffect(()=>{load()},[load]);
  const submit=async(e)=>{e.preventDefault();try{const payload={...form,customer_id:form.customer_id?Number(form.customer_id):null};const url=editing?`${API}/finance/customer-tax-profiles/${editing}`:`${API}/finance/customer-tax-profiles`;const r=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok||j.success===false)throw new Error(j.message||"تعذر الحفظ.");setForm(blank);setEditing(null);setShow(false);load()}catch(e){setError(e.message)}};
  const edit=r=>{setEditing(r.id);setForm({...blank,...r,customer_id:r.customer_id??""});setShow(true)};
  const fields=[["customer_id","Customer ID"],["customer_code","كود العميل"],["legal_name_ar","الاسم القانوني عربي"],["legal_name_en","الاسم القانوني إنجليزي"],["vat_number","الرقم الضريبي"],["commercial_register","السجل التجاري"],["building_number","رقم المبنى"],["street_name","الشارع"],["district","الحي"],["city","المدينة"],["postal_code","الرمز البريدي"],["country_code","الدولة"]];
  const cols=[{key:"customer_code",label:"كود العميل"},{key:"legal_name_ar",label:"العميل"},{key:"vat_number",label:"الرقم الضريبي"},{key:"commercial_register",label:"السجل التجاري"},{key:"city",label:"المدينة"},{key:"actions",label:"",render:r=><button className="finx-btn finx-btn-soft" onClick={()=>edit(r)}>تعديل</button>}];
  return <FinancePageShell icon={Building2} title="بيانات العملاء الضريبية" description="ملفات المشترين الضريبية المستخدمة عند إنشاء وإصدار الفواتير." loading={loading} error={error} onRefresh={load} actions={<button className="finx-btn finx-btn-primary" onClick={()=>{setEditing(null);setForm(blank);setShow(v=>!v)}}><Plus size={16}/> عميل ضريبي</button>}>
    {show&&<form className="finx-card" onSubmit={submit}><div className="finx-form-grid">{fields.map(([k,l])=><label key={k}>{l}<input value={form[k]??""} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<label><input type="checkbox" checked={!!form.is_vat_registered} onChange={e=>setForm({...form,is_vat_registered:e.target.checked})}/> مسجل في ضريبة القيمة المضافة</label><label><input type="checkbox" checked={!!form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> نشط</label></div><button className="finx-btn finx-btn-primary" type="submit">{editing?"حفظ التعديل":"حفظ العميل"}</button></form>}
    <FinanceTable rows={rows} columns={cols} emptyText="لا توجد بيانات ضريبية للعملاء."/>
  </FinancePageShell>
}
