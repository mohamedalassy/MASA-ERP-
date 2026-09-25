import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Sparkles } from "lucide-react";
import { Shell, Btn, Panel } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

export default function AIMessageComposer({onNavigate,activeView="ai-sales-message"}) {
  const [companies,setCompanies]=useState([]), [companyId,setCompanyId]=useState("");
  const [channel,setChannel]=useState("email"), [purpose,setPurpose]=useState("introduction");
  const [tone,setTone]=useState("professional"), [draft,setDraft]=useState(null);
  const [loading,setLoading]=useState(false), [error,setError]=useState("");

  useEffect(()=>{
    aiSalesRequest("/companies")
      .then(r=>setCompanies(r?.data||r||[]))
      .catch(e=>setError(e?.message||"Unable to load companies."));
  },[]);

  const generate=async()=>{
    if(!companyId){setError("Select a company first.");return;}
    setLoading(true); setError("");
    try {
      const result=await aiSalesRequest(`/companies/${companyId}/compose-message`,{
        method:"POST", body:JSON.stringify({channel,purpose,tone})
      });
      setDraft(result);
    } catch(e){setError(e?.message||"Unable to compose message.");}
    finally{setLoading(false);}
  };

  const approve=async()=>{
    if(!draft?.id)return;
    setError("");
    try {
      setDraft(await aiSalesRequest(`/message-drafts/${draft.id}/approve`,{method:"POST"}));
    } catch(e){setError(e?.message||"Unable to approve draft.");}
  };

  return <Shell activeView={activeView} onNavigate={onNavigate}
    title="استوديو الرسائل الذكية"
    subtitle="أنشئ مسودات سياقية من درجات الشركات وإشارات الشراء الحقيقية.">
    {error&&<div className="ai-error">{error}</div>}
    <div className="workspace-2">
      <Panel title="سياق الرسالة"><div className="pro-form">
        <label>الشركة</label>
        <select value={companyId} onChange={e=>setCompanyId(e.target.value)}>
          <option value="">Select company</option>
          {companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label>Channel</label>
        <select value={channel} onChange={e=>setChannel(e.target.value)}>
          <option value="email">Email</option><option value="whatsapp">WhatsApp</option>
          <option value="sms">SMS</option><option value="other">Other</option>
        </select>
        <label>Purpose</label>
        <select value={purpose} onChange={e=>setPurpose(e.target.value)}>
          <option value="introduction">Introduction</option><option value="discovery">Discovery meeting</option>
          <option value="follow_up">Follow up</option><option value="proposal">Proposal follow-up</option>
        </select>
        <label>Tone</label>
        <select value={tone} onChange={e=>setTone(e.target.value)}>
          <option value="professional">Professional</option><option value="consultative">Consultative</option>
          <option value="concise">Concise</option><option value="friendly">Friendly</option>
        </select>
        <Btn onClick={generate} disabled={loading}><Sparkles size={14}/>{loading?"جارٍ الإنشاء...":"إنشاء مسودة"}</Btn>
      </div></Panel>
      <div className="message-studio">
        <small>AI ASSISTED DRAFT</small>
        <h3>{draft?.subject||"إنشاء مسودة تواصل سياقية"}</h3>
        <p style={{whiteSpace:"pre-wrap"}}>{draft?.body||"ستظهر الرسالة هنا وتبقى مسودة حتى يعتمدها المستخدم."}</p>
        {draft&&<div style={{display:"flex",gap:8}}>
          <Btn secondary onClick={generate}><RefreshCw size={14}/> Regenerate</Btn>
          {draft.status==="approved"
            ? <Btn disabled><CheckCircle2 size={14}/> Approved</Btn>
            : <Btn onClick={approve}>Approve Message</Btn>}
        </div>}
      </div>
    </div>
  </Shell>;
}