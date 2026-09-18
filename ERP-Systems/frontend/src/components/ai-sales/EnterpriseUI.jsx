import {
  UsersRound, Building2, Handshake, Coins, Target, TrendingUp, ArrowUpRight,
  Search, Sparkles, MapPin, ShieldCheck, BellRing, Activity, CheckCircle2
} from "lucide-react";

export const companies=[
 {name:"Northstar Holdings",category:"Business Services",location:"Dammam",score:92,added:"2h ago",value:"SAR 980,000",stage:"Proposal"},
 {name:"Horizon Group",category:"Enterprise",location:"Riyadh",score:88,added:"3h ago",value:"SAR 2,500,000",stage:"Proposal"},
 {name:"Future Ventures",category:"Professional Services",location:"Khobar",score:85,added:"5h ago",value:"SAR 750,000",stage:"Qualified"},
 {name:"Golden Group",category:"Commercial",location:"Jeddah",score:82,added:"6h ago",value:"SAR 1,200,000",stage:"Qualified"},
 {name:"National Trading Group",category:"Trading",location:"Riyadh",score:78,added:"8h ago",value:"SAR 1,800,000",stage:"Negotiation"},
];

export function Kpi({type,title,value,delta,note}) {
 const icons={leads:UsersRound,companies:Building2,opportunities:Handshake,pipeline:Coins,rate:Target}; const I=icons[type]||TrendingUp;
 return <article className={"ent-kpi "+type}><div className="kpi-icon"><I size={22}/></div><div className="kpi-main"><span>{title}</span><div><strong>{value}</strong><em>↑ {delta}</em></div><small>{note}</small></div><div className="spark"><i/><i/><i/><i/><i/><i/></div></article>
}
export function Panel({title,action="View All",children,className=""}){return <section className={"ent-panel "+className}><header><h3>{title}</h3>{action&&<button>{action} <ArrowUpRight size={13}/></button>}</header>{children}</section>}
export function Score({n}){return <b className={"score "+(n>=85?"green":n>=80?"amber":"")}>{n}</b>}
export function CompanyRows(){return <div className="data-table"><div className="tr th"><span>Company</span><span>Category</span><span>Location</span><span>Score</span><span>Added</span></div>{companies.map(c=><div className="tr" key={c.name}><b>{c.name}</b><span>{c.category}</span><span>{c.location}</span><Score n={c.score}/><span>{c.added}</span></div>)}</div>}
export function PageTitle({eyebrow="AI SALES",title,subtitle,children}){return <div className="page-title"><div><small>{eyebrow}</small><h1>{title}</h1><p>{subtitle}</p></div><aside>{children}</aside></div>}
export function Btn({children,secondary=false}){return <button className={"ent-btn "+(secondary?"secondary":"")}>{children}</button>}
export const uiIcons={Search,Sparkles,MapPin,ShieldCheck,BellRing,Activity,CheckCircle2,Building2,Handshake,Target,TrendingUp};
