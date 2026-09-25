/*
 * MASA AI Sales Arabic UI layer
 * UI-only localization: API paths, request values, IDs and backend enums are never changed.
 */
const EXACT = new Map(Object.entries({
  "Sales Command Center":"مركز قيادة المبيعات",
  "Discover New Leads":"اكتشاف عملاء محتملين جدد",
  "Discovered Leads":"العملاء المكتشفون",
  "Company Intelligence":"ذكاء الشركات",
  "Company 360":"ملف الشركة 360°",
  "AI Analysis":"تحليل الذكاء الاصطناعي",
  "Leads":"العملاء المحتملون",
  "Lead Details":"تفاصيل العميل المحتمل",
  "Opportunities":"الفرص",
  "Opportunity Details":"تفاصيل الفرصة",
  "Map & Territories":"الخريطة والمناطق",
  "Signals Radar":"رادار الإشارات",
  "Tender & Projects Radar":"رادار المنافسات والمشاريع",
  "Communications Center":"مركز الاتصالات",
  "AI Message Studio":"استوديو الرسائل الذكية",
  "Tasks & Follow-ups":"المهام والمتابعات",
  "Sales Playbooks":"خطط المبيعات",
  "Sales Analytics":"تحليلات المبيعات",
  "AI Command Center":"مركز أوامر الذكاء الاصطناعي",
  "AI Sales Settings":"إعدادات المبيعات الذكية",
  "Home":"الرئيسية","Discover":"اكتشاف","Companies":"الشركات","Tenders":"المنافسات",
  "Map":"الخريطة","Signals":"الإشارات","Messages":"الرسائل","Tasks":"المهام",
  "Reports":"التقارير","Settings":"الإعدادات","AI":"الذكاء",
  "Total Leads":"إجمالي العملاء المحتملين","Target Companies":"الشركات المستهدفة",
  "Target Accounts":"الحسابات المستهدفة","Qualified":"مؤهل","Qualified Accounts":"الحسابات المؤهلة",
  "Hot Leads":"عملاء ساخنون","High Intent":"نية شراء مرتفعة","Pipeline Value":"قيمة مسار المبيعات",
  "Win Rate":"معدل الفوز","Leads by Source":"العملاء حسب المصدر","Pipeline by Stage":"المسار حسب المرحلة",
  "Leads by Region":"العملاء حسب المنطقة","AI Insights":"رؤى الذكاء الاصطناعي",
  "Recent Leads":"أحدث العملاء","Upcoming Follow-ups":"المتابعات القادمة","Top Opportunities":"أهم الفرص",
  "Discovery Configuration":"إعدادات الاكتشاف","Target Products & Services":"المنتجات والخدمات المستهدفة",
  "Company Signals":"إشارات الشركات","Sync ERP Catalog":"مزامنة كتالوج ERP",
  "Add Target":"إضافة هدف","Add Sales Target":"إضافة هدف مبيعات","Create Target":"إنشاء الهدف",
  "Start AI Discovery →":"بدء الاكتشاف بالذكاء الاصطناعي ←",
  "AI is scanning the market...":"الذكاء الاصطناعي يفحص السوق...",
  "DISCOVERY AGENT":"وكيل الاكتشاف","Ready to scan the market":"جاهز لفحص السوق",
  "Targets":"الأهداف","Catalog":"الكتالوج","Lead Intelligence":"ذكاء العملاء المحتملين",
  "Discovered":"مكتشف","Refresh":"تحديث","Refreshing...":"جارٍ التحديث...",
  "Discover More":"اكتشاف المزيد","All Scores":"كل الدرجات","Company":"الشركة","Industry":"القطاع",
  "Location":"الموقع","AI Score":"درجة الذكاء","Status":"الحالة","Fit":"الملاءمة","Intent":"النية",
  "Timing":"التوقيت","Confidence":"الثقة","Account fit":"ملاءمة الحساب","Buying intent":"نية الشراء",
  "Buying timing":"توقيت الشراء","Data confidence":"موثوقية البيانات",
  "Account Signals":"إشارات الحساب","Recommended Products & Services":"المنتجات والخدمات المقترحة",
  "Convert to Lead":"تحويل إلى عميل محتمل","Converting...":"جارٍ التحويل...","View Lead":"عرض العميل",
  "Back to Discovered Leads":"العودة للعملاء المكتشفين","No company selected.":"لم يتم اختيار شركة.",
  "New":"جديد","Qualified":"مؤهل","Proposal":"عرض","Negotiation":"تفاوض","Won":"فائز",
  "Open":"مفتوح","Closed":"مغلق","Draft":"مسودة","Approved":"معتمد","Active":"نشط","Inactive":"غير نشط",
  "High":"مرتفع","Medium":"متوسط","Low":"منخفض","Urgent":"عاجل",
  "Search":"بحث","Search companies, sectors or cities...":"ابحث عن شركة أو قطاع أو مدينة...",
  "Search company, industry, city or region...":"ابحث باسم الشركة أو القطاع أو المدينة أو المنطقة...",
  "No discovered companies found":"لا توجد شركات مكتشفة","No companies match the current filters":"لا توجد شركات تطابق عوامل التصفية",
  "ERP Catalog Intelligence":"ذكاء كتالوج ERP","Catalog Profiles":"ملفات الكتالوج",
  "Product Profiles":"ملفات المنتجات","Linked ERP Products":"منتجات ERP المرتبطة","Service Profiles":"ملفات الخدمات",
  "Intelligence Profiles":"ملفات الذكاء","Profile":"الملف","Type":"النوع","ERP Link":"الربط مع ERP",
  "Keywords":"الكلمات المفتاحية","Configure":"إعداد","Synchronizing...":"جارٍ المزامنة...",
  "Loading...":"جارٍ التحميل...","Loading catalog intelligence...":"جارٍ تحميل ذكاء الكتالوج...",
  "No catalog profiles yet":"لا توجد ملفات كتالوج حتى الآن",
  "Products Scanned":"المنتجات المفحوصة","Profiles Created":"ملفات تم إنشاؤها",
  "Profiles Updated":"ملفات تم تحديثها","Total Profiles":"إجمالي الملفات",
  "Show top accounts":"عرض أهم الحسابات","Latest signals":"أحدث الإشارات","Show latest signals":"عرض أحدث الإشارات",
  "Show opportunities":"عرض الفرص","Show leads":"عرض العملاء المحتملين","Run Command":"تشغيل الأمر",
  "Analyzing...":"جارٍ التحليل...","RESULT":"النتيجة","Start with a command":"ابدأ بأمر",
  "No results found":"لا توجد نتائج","Strength":"القوة","Value":"القيمة","Score":"الدرجة",
  "Intelligence online":"الذكاء متصل","MASA SALES INTELLIGENCE":"ذكاء ماسة للمبيعات",
  "What should AI Sales inspect?":"ما الذي تريد من ماسة AI تحليله؟",
  "What should AI work on?":"ما المهمة التي تريد من الذكاء تنفيذها؟",
  "Create Task":"إنشاء مهمة","New Task":"مهمة جديدة","Task":"المهمة","Priority":"الأولوية",
  "Due Date":"تاريخ الاستحقاق","Completed":"مكتمل","Open Tasks":"المهام المفتوحة",
  "Create Playbook":"إنشاء خطة","Trigger Type":"نوع المشغل","Description":"الوصف","Steps":"الخطوات",
  "Communication History":"سجل الاتصالات","Compose with AI":"إنشاء بالذكاء الاصطناعي",
  "Save Draft":"حفظ المسودة","Approve":"اعتماد","Subject":"الموضوع","Channel":"القناة","Tone":"النبرة",
  "Email":"البريد الإلكتروني","Professional":"احترافية","Introduction":"تعريف",
  "Generate":"إنشاء","Generate Message":"إنشاء الرسالة",
  "Pipeline by Stage":"مسار المبيعات حسب المرحلة","Signals by Type":"الإشارات حسب النوع",
  "Companies":"الشركات","Pipeline":"مسار المبيعات","Won":"فائز",
  "Saudi Arabia":"المملكة العربية السعودية","Eastern Province":"المنطقة الشرقية",
  "Riyadh":"الرياض","Makkah":"مكة المكرمة","Madinah":"المدينة المنورة","Qassim":"القصيم",
  "Today":"اليوم","Tomorrow":"غدًا","All Regions":"كل المناطق",
  "Manual Profile":"ملف يدوي","Product":"منتج","Service":"خدمة","Subscription":"اشتراك",
  "Project":"مشروع","Solution":"حل","PRODUCT":"منتج","SERVICE":"خدمة",
  "New Business":"نشاط جديد","Expansion":"توسع","New Branch":"فرع جديد","Hiring":"توظيف",
  "Projects":"مشاريع","Funding":"تمويل","Procurement":"مشتريات",
  "New Lead":"عميل جديد","Follow-up":"متابعة","Follow up":"متابعة",
  "Source":"المصدر","Region":"المنطقة","City":"المدينة","Country":"الدولة",
  "Owner":"المسؤول","Probability":"الاحتمالية","Stage":"المرحلة","Created":"تاريخ الإنشاء",
  "Save":"حفظ","Cancel":"إلغاء","Close":"إغلاق","Edit":"تعديل","Delete":"حذف","Create":"إنشاء",
  "Add":"إضافة","Apply":"تطبيق","Reset":"إعادة ضبط","Clear":"مسح","View":"عرض","Details":"التفاصيل"
}));

const PHRASES = [
  ["Discover demand, prioritize the right accounts and grow revenue with AI.","اكتشف الطلب، ورتّب الحسابات المناسبة حسب الأولوية، ونمِّ الإيرادات بالذكاء الاصطناعي."],
  ["Review AI discoveries, evidence, scores and recommended next actions.","راجع اكتشافات الذكاء والأدلة والدرجات والإجراءات التالية المقترحة."],
  ["A live target-account workspace with enrichment, signals and opportunity context.","مساحة عمل مباشرة للحسابات المستهدفة تشمل الإثراء والإشارات وسياق الفرص."],
  ["Everything your sales team needs before contacting a target account.","كل ما يحتاجه فريق المبيعات قبل التواصل مع الحساب المستهدف."],
  ["Build a precise target market and let AI surface companies with real buying signals.","حدد سوقك المستهدف بدقة ودع الذكاء الاصطناعي يكشف الشركات ذات إشارات الشراء الحقيقية."],
  ["Query your live AI Sales intelligence and turn ERP data into focused sales actions.","استعلم من ذكاء المبيعات المباشر وحوّل بيانات ERP إلى إجراءات مبيعات مركزة."],
  ["Search live companies, signals, leads and opportunities from one command workspace.","ابحث في الشركات والإشارات والعملاء والفرص مباشرة من مساحة أوامر واحدة."],
  ["Use one of the suggested commands above or type your own request.","استخدم أحد الأوامر المقترحة أو اكتب طلبك مباشرة."],
  ["Run AI Discovery or change the current filters.","شغّل الاكتشاف بالذكاء الاصطناعي أو غيّر عوامل التصفية الحالية."],
  ["Change the filters or run AI Discovery to add more accounts.","غيّر عوامل التصفية أو شغّل الاكتشاف لإضافة حسابات جديدة."],
  ["AI uses your ERP catalog and sales settings to find, enrich, verify and score relevant accounts before they reach your team.","يستخدم الذكاء كتالوج ERP وإعدادات المبيعات لاكتشاف الحسابات المناسبة وإثرائها والتحقق منها وتقييمها قبل وصولها لفريقك."],
];

function translateString(value) {
  if (!value || typeof value !== "string") return value;
  const trimmed=value.trim();
  if (EXACT.has(trimmed)) return value.replace(trimmed, EXACT.get(trimmed));
  let out=value;
  for (const [en,ar] of PHRASES) out=out.replace(en,ar);
  return out;
}

function translateElement(el) {
  if (!(el instanceof Element)) return;
  for (const attr of ["placeholder","title","aria-label"]) {
    if (el.hasAttribute(attr)) {
      const old=el.getAttribute(attr), next=translateString(old);
      if (next!==old) el.setAttribute(attr,next);
    }
  }
  if (el.tagName==="OPTION" && el.textContent) {
    const next=translateString(el.textContent);
    if(next!==el.textContent) el.textContent=next;
  }
}

function translateTextNode(node) {
  if (node.nodeType!==Node.TEXT_NODE || !node.nodeValue?.trim()) return;
  const parent=node.parentElement;
  if (!parent || ["SCRIPT","STYLE","CODE","PRE"].includes(parent.tagName)) return;
  const next=translateString(node.nodeValue);
  if(next!==node.nodeValue) node.nodeValue=next;
}

function walk(root) {
  if (!root) return;
  if (root.nodeType===Node.TEXT_NODE) return translateTextNode(root);
  if (root instanceof Element) translateElement(root);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
  let n;
  while((n=walker.nextNode())) {
    if(n.nodeType===Node.TEXT_NODE) translateTextNode(n);
    else translateElement(n);
  }
}

export function applyArabicUi() {
  const root=document.querySelector(".ai-enterprise");
  if(!root) return ()=>{};
  root.setAttribute("dir","rtl"); root.setAttribute("lang","ar");
  walk(root);
  const observer=new MutationObserver((mutations)=>{
    for(const m of mutations){
      if(m.type==="characterData") translateTextNode(m.target);
      for(const node of m.addedNodes) walk(node);
    }
  });
  observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
  return ()=>observer.disconnect();
}
