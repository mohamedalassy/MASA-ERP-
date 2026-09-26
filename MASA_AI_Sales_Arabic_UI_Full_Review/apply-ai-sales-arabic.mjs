import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pages = path.join(root, "ERP-Systems", "frontend", "src", "pages", "ai-sales");
const components = path.join(root, "ERP-Systems", "frontend", "src", "components", "ai-sales");
if (!fs.existsSync(pages)) {
  console.error("Run this script from C:\\pro\\MASA (repository root).");
  process.exit(1);
}
const translations = JSON.parse(fs.readFileSync(new URL("./translations.json", import.meta.url), "utf8"));
const backupRoot = path.join(root, "_ai_sales_backup_before_arabic_final");
fs.mkdirSync(backupRoot, {recursive:true});

const targets = [
  ...fs.readdirSync(pages).filter(x=>x.endsWith(".jsx")).map(x=>path.join(pages,x)),
  path.join(components,"EnterpriseUI.jsx"),
  path.join(components,"AISalesNav.jsx"),
  path.join(components,"ai-sales-nav.css"),
  path.join(pages,"shared.jsx"),
  path.join(pages,"ai-sales-enterprise.css"),
].filter(fs.existsSync);

function backup(file){
  const rel=path.relative(root,file);
  const dest=path.join(backupRoot,rel);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.copyFileSync(file,dest);
}
for(const file of targets) backup(file);

for(const file of targets.filter(x=>x.endsWith(".jsx"))){
  let s=fs.readFileSync(file,"utf8");
  for(const [en,ar] of Object.entries(translations)){
    s=s.split(`"${en}"`).join(`"${ar}"`);
    s=s.split(`'${en}'`).join(`'${ar}'`);
    s=s.split(`>${en}<`).join(`>${ar}<`);
  }
  if(file.endsWith("shared.jsx")){
    s=s.replace(/<div className="ai-enterprise"\s+dir="ltr">/g,'<div className="ai-enterprise ai-ar" dir="rtl" lang="ar">');
    s=s.replace(/<div className="ai-enterprise"\s+dir="rtl">/g,'<div className="ai-enterprise ai-ar" dir="rtl" lang="ar">');
  }
  if(file.endsWith("EnterpriseUI.jsx")){
    s=s.replace(/value >= 85\s*\?\s*"green"\s*:\s*value >= 80\s*\?\s*"amber"\s*:\s*""/m,'value >= 85 ? "ai-score-high" : value >= 70 ? "ai-score-medium" : "ai-score-low"');
  }
  fs.writeFileSync(file,s,"utf8");
}

const nav=path.join(components,"AISalesNav.jsx");
if(fs.existsSync(nav)){
  let s=fs.readFileSync(nav,"utf8");
  const navMap={"Home":"الرئيسية","Discover":"اكتشاف","Companies":"الشركات","Leads":"العملاء المحتملون","Opportunities":"الفرص","Tenders":"المنافسات","Map":"الخريطة","Signals":"الإشارات","Messages":"الرسائل","Tasks":"المهام","Reports":"التقارير","AI":"الذكاء","Settings":"الإعدادات"};
  for(const [en,ar] of Object.entries(navMap)) s=s.split(`"${en}"`).join(`"${ar}"`);
  fs.writeFileSync(nav,s,"utf8");
}

const cssTarget=path.join(pages,"ai-sales-enterprise.css");
const polish=fs.readFileSync(new URL("./final-polish.css",import.meta.url),"utf8");
let css=fs.readFileSync(cssTarget,"utf8");
const marker="/* MASA AI SALES FINAL ARABIC REVIEW V3 */";
if(css.includes(marker)) css=css.slice(0,css.indexOf(marker)).trimEnd()+"\n\n";
fs.writeFileSync(cssTarget,css+polish,"utf8");

const navCss=path.join(components,"ai-sales-nav.css");
let nc=fs.readFileSync(navCss,"utf8");
nc += `\n/* MASA Arabic nav final */\n.ai-icon-nav{direction:rtl;padding:7px 10px;gap:4px}.ai-icon-nav button{min-width:76px;padding:8px 8px 7px}.ai-icon-nav button small{font-size:11px;font-weight:800;line-height:1.45;white-space:nowrap}\n`;
fs.writeFileSync(navCss,nc,"utf8");

console.log("MASA AI Sales Arabic/UI final patch applied.");
console.log("Backup:", backupRoot);
console.log("Next: cd ERP-Systems\\frontend && npm.cmd run build");
