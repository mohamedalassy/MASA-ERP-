const API=(import.meta.env.VITE_API_URL||"http://127.0.0.1:8000/api").replace(/\/$/,"");

export async function hrApi(path,options={}){
  const token=localStorage.getItem("token");
  const headers={
    Accept:"application/json",
    ...(options.body?{"Content-Type":"application/json"}:{}),
    ...(token?{Authorization:`Bearer ${token}`}:{ }),
    ...(options.headers||{})
  };
  const r=await fetch(API+path,{...options,headers});
  const b=await r.json().catch(()=>({}));
  if(!r.ok){
    const validation=b.errors?Object.values(b.errors).flat().join(" "):"";
    throw new Error(validation||b.message||"تعذر تنفيذ طلب الموارد البشرية");
  }
  return b;
}

export const hrGet=(path)=>hrApi(path);
export const hrPost=(path,data={})=>hrApi(path,{method:"POST",body:JSON.stringify(data)});
export const hrPut=(path,data={})=>hrApi(path,{method:"PUT",body:JSON.stringify(data)});
export const hrPatch=(path,data={})=>hrApi(path,{method:"PATCH",body:JSON.stringify(data)});
export const hrDelete=(path)=>hrApi(path,{method:"DELETE"});
