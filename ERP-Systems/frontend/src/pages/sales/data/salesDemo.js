export const money = (v=0)=>new Intl.NumberFormat("en-SA",{style:"currency",currency:"SAR",maximumFractionDigits:0}).format(v);
export const opportunities=[
{id:1,name:"Security Upgrade — Dammam Plant",customer:"Eastern Industrial Co.",value:380000,probability:78,stage:"Negotiation",health:"Healthy",close:"30 Sep",owner:"Ahmed"},
{id:2,name:"HQ Low Current Expansion",customer:"Al Noor Contracting",value:265000,probability:64,stage:"Quotation",health:"Watch",close:"04 Oct",owner:"Mohamed"},
{id:3,name:"Network Refresh 2026",customer:"Gulf Logistics",value:195000,probability:52,stage:"Pricing",health:"At Risk",close:"12 Oct",owner:"Sara"},
{id:4,name:"Multi-site CCTV Rollout",customer:"National Clinics Group",value:510000,probability:84,stage:"Negotiation",health:"Healthy",close:"28 Sep",owner:"Khaled"}];
export const leads=[
{id:1,company:"Al Raya Development",contact:"Omar Hassan",industry:"Construction",source:"Referral",score:92,owner:"Ahmed",last:"35m ago",status:"New",next:"Call today"},
{id:2,company:"Nova Medical",contact:"Rania Adel",industry:"Healthcare",source:"Website",score:86,owner:"Sara",last:"2h ago",status:"Qualified",next:"Site visit"},
{id:3,company:"Gulf Warehousing",contact:"Faisal N.",industry:"Logistics",source:"Campaign",score:74,owner:"Mohamed",last:"5h ago",status:"Working",next:"Send profile"},
{id:4,company:"Al Safwa Hospitality",contact:"Mona A.",industry:"Hospitality",source:"LinkedIn",score:61,owner:"Khaled",last:"Yesterday",status:"Nurture",next:"Follow-up"}];
export const stages=[
{name:"Discovery",value:430000,deals:8},{name:"Solution",value:710000,deals:6},{name:"Pricing",value:1200000,deals:9},{name:"Quotation",value:1600000,deals:12},{name:"Negotiation",value:890000,deals:7}];
export const customers=[
{name:"Eastern Industrial Co.",tier:"Enterprise",city:"Dammam",revenue:1850000,pipeline:420000,outstanding:88000,margin:31,health:"Healthy"},
{name:"Al Noor Contracting",tier:"Growth",city:"Khobar",revenue:940000,pipeline:265000,outstanding:142000,margin:27,health:"Watch"},
{name:"National Clinics Group",tier:"Enterprise",city:"Riyadh",revenue:2320000,pipeline:510000,outstanding:64000,margin:34,health:"Healthy"},
{name:"Gulf Logistics",tier:"Growth",city:"Dammam",revenue:710000,pipeline:195000,outstanding:210000,margin:22,health:"At Risk"}];
