import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { API, FinancePageShell, FinanceTable } from "./FinancePageShared";

const blank = { legal_name_ar:"",legal_name_en:"",vat_number:"",commercial_register:"",building_number:"",street_name:"",district:"",city:"",postal_code:"",country_code:"SA",branch_name:"",branch_code:"",is_default:false,is_active:true };

export default function CompanyTaxProfile() {
  const [rows,setRows]=useState([]); const [form,setForm]=useState(blank);
  const [editing,setEditing]=useState(null); const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(true); const [error,setError]=useState("");

  const load=useCallback(async()=>{try{setLoading(true);setError("");const r=await fetch(`${API}/finance/tax-profiles`);const j=await r.json();if(!r.ok||j.success===false)throw new Error(j.message||"تعذر تحميل الملف الضريبي.");setRows(j.data||[])}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  useEffect(()=>{load()},[load]);

  const submit=async(e)=>{e.preventDefault();try{setError("");const url=editing?`${API}/finance/tax-profiles/${editing}`:`${API}/finance/tax-profiles`;const r=await fetch(url,{method:editing?"PUT":"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(form)});const j=await r.json();if(!r.ok||j.success===false)throw new Error(j.message||"تعذر الحفظ.");setForm(blank);setEditing(null);setShow(false);load()}catch(e){setError(e.message)}};
  const edit=(r)=>{setEditing(r.id);setForm({...blank,...r});setShow(true)};
  const fields=[["legal_name_ar","الاسم القانوني عربي"],["legal_name_en","الاسم القانوني إنجليزي"],["vat_number","الرقم الضريبي"],["commercial_register","السجل التجاري"],["building_number","رقم المبنى"],["street_name","الشارع"],["district","الحي"],["city","المدينة"],["postal_code","الرمز البريدي"],["country_code","الدولة"],["branch_name","اسم الفرع"],["branch_code","كود الفرع"]];
  const columns=[{key:"legal_name_ar",label:"المنشأة"},{key:"vat_number",label:"الرقم الضريبي"},{key:"commercial_register",label:"السجل التجاري"},{key:"city",label:"المدينة"},{key:"is_default",label:"افتراضي",render:r=>r.is_default?"نعم":"لا"},{key:"actions",label:"",render:r=><button className="finx-btn finx-btn-soft" onClick={()=>edit(r)}>تعديل</button>}];

  return <FinancePageShell icon={Building2} title="الملف الضريبي للمنشأة" description="بيانات المنشأة المستخدمة في الفواتير الضريبية والفوترة الإلكترونية." loading={loading} error={error} onRefresh={load} actions={<button className="finx-btn finx-btn-primary" onClick={()=>{setEditing(null);setForm(blank);setShow(v=>!v)}}><Plus size={16}/> ملف جديد</button>}>
    {show&&<form className="finx-card" onSubmit={submit}><div className="finx-form-grid">{fields.map(([k,l])=><label key={k}>{l}<input value={form[k]??""} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
      <label><input type="checkbox" checked={!!form.is_default} onChange={e=>setForm({...form,is_default:e.target.checked})}/> الملف الافتراضي</label>
      <label><input type="checkbox" checked={!!form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> نشط</label>
    </div><button className="finx-btn finx-btn-primary" type="submit">{editing?"حفظ التعديل":"حفظ الملف"}</button></form>}
    <FinanceTable rows={rows} columns={columns} emptyText="لا توجد ملفات ضريبية للمنشأة."/>
  </FinancePageShell>;
}
