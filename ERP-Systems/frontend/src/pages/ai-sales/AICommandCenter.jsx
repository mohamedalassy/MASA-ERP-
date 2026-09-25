import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  Clock3,
  Handshake,
  Lightbulb,
  RadioTower,
  Search,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";
import { Shell, Btn, Score } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

const SUGGESTIONS = [
  { label: "عرض أهم الحسابات", command: "show top accounts", icon: Building2 },
  { label: "أحدث الإشارات", command: "show latest signals", icon: RadioTower },
  { label: "الفرص", command: "show opportunities", icon: Handshake },
  { label: "العملاء المحتملون", command: "show leads", icon: UsersRound },
];

const money = (value, currency = "SAR") => {
  const n = Number(value || 0);
  return `${currency} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}`;
};

const scoreOf = (row) =>
  row?.latest_score?.overall_score ??
  row?.latestScore?.overall_score ??
  row?.overall_score ??
  row?.score ??
  0;

const companyName = (row) =>
  row?.company?.name ?? row?.company_name ?? row?.name ?? "Unnamed company";

function EmptyState({ intent }) {
  return (
    <div className="command-empty">
      <div><Search size={22} /></div>
      <strong>لا توجد نتائج</strong>
      <span>No matching {String(intent || "records").replaceAll("_", " ")} are available yet.</span>
    </div>
  );
}

function TopAccounts({ rows, onNavigate }) {
  if (!rows.length) return <EmptyState intent="accounts" />;
  return (
    <div className="command-result-grid">
      {rows.map((row) => (
        <article className="command-account-card" key={row.id ?? row.name}>
          <div className="command-account-head">
            <div className="command-company-icon"><Building2 size={18} /></div>
            <div>
              <strong>{row.name || "Unnamed company"}</strong>
              <span>{[row.industry, row.city, row.region].filter(Boolean).join(" • ") || "ذكاء الشركة"}</span>
            </div>
            <Score n={scoreOf(row)} />
          </div>
          <div className="command-account-meta">
            <span><small>الملاءمة</small><b>{row?.latest_score?.fit_score ?? row?.latestScore?.fit_score ?? "—"}</b></span>
            <span><small>النية</small><b>{row?.latest_score?.intent_score ?? row?.latestScore?.intent_score ?? "—"}</b></span>
            <span><small>التوقيت</small><b>{row?.latest_score?.timing_score ?? row?.latestScore?.timing_score ?? "—"}</b></span>
          </div>
          <button type="button" className="command-open-link" onClick={() => onNavigate?.("ai-sales-companies")}>
            Open companies <ArrowRight size={13} />
          </button>
        </article>
      ))}
    </div>
  );
}

function Signals({ rows }) {
  if (!rows.length) return <EmptyState intent="signals" />;
  return (
    <div className="command-list">
      {rows.map((row) => (
        <article className="command-list-row" key={row.id}>
          <div className="command-list-icon"><RadioTower size={17} /></div>
          <div className="command-list-main">
            <strong>{row.title || row.type || "إشارة"}</strong>
            <span>{companyName(row)}{row.description ? ` • ${row.description}` : ""}</span>
          </div>
          <div className="command-list-score">
            <small>القوة</small>
            <b>{row.strength ?? "—"}</b>
          </div>
        </article>
      ))}
    </div>
  );
}

function Opportunities({ rows }) {
  if (!rows.length) return <EmptyState intent="opportunities" />;
  return (
    <div className="command-list">
      {rows.map((row) => (
        <article className="command-list-row" key={row.id}>
          <div className="command-list-icon"><Handshake size={17} /></div>
          <div className="command-list-main">
            <strong>{row.name || row.title || companyName(row)}</strong>
            <span>{companyName(row)} • {row.stage || "Open opportunity"}</span>
          </div>
          <div className="command-list-value">
            <small>القيمة</small>
            <b>{money(row.value ?? row.estimated_value, row.currency || "SAR")}</b>
          </div>
          <div className="command-probability">{Number(row.probability || 0)}%</div>
        </article>
      ))}
    </div>
  );
}

function Leads({ rows }) {
  if (!rows.length) return <EmptyState intent="leads" />;
  return (
    <div className="command-list">
      {rows.map((row) => (
        <article className="command-list-row" key={row.id}>
          <div className="command-list-icon"><Target size={17} /></div>
          <div className="command-list-main">
            <strong>{companyName(row)}</strong>
            <span>{row.status || "عميل محتمل"}{row.source ? ` • ${row.source}` : ""}</span>
          </div>
          <div className="command-list-score">
            <small>الدرجة</small>
            <b>{row.score ?? row.ai_score ?? "—"}</b>
          </div>
        </article>
      ))}
    </div>
  );
}

function Summary({ data }) {
  const cards = [
    ["الشركات", data?.companies ?? 0, Building2],
    ["العملاء المحتملون", data?.leads ?? 0, UsersRound],
    ["الفرص", data?.opportunities ?? 0, Handshake],
    ["التوصيات", data?.open_recommendations ?? 0, Lightbulb],
  ];
  return (
    <div className="command-summary-grid">
      {cards.map(([label, value, Icon]) => (
        <article key={label}>
          <span><Icon size={18} /></span>
          <div><small>{label}</small><strong>{value}</strong></div>
        </article>
      ))}
    </div>
  );
}

export default function AICommandCenter({ onNavigate, activeView = "ai-sales-command" }) {
  const [command, setCommand] = useState("");
  const [result, setResult] = useState(null);
  const [lastCommand, setLastCommand] = useState("");
  const [lastRunAt, setLastRunAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const intent = result?.intent || "summary";
  const data = result?.data;
  const rows = useMemo(() => Array.isArray(data) ? data : [], [data]);

  const run = async (text = command) => {
    const value = String(text || "").trim();
    if (!value || loading) return;
    setCommand(value);
    setLoading(true);
    setError("");
    try {
      const response = await aiSalesRequest("/command", {
        method: "POST",
        body: JSON.stringify({ command: value }),
      });
      setResult(response);
      setLastCommand(value);
      setLastRunAt(new Date());
    } catch (e) {
      setError(e?.message || "تعذر تنفيذ الأمر.");
    } finally {
      setLoading(false);
    }
  };

  const renderResult = () => {
    if (!result) return null;
    if (intent === "top_accounts") return <TopAccounts rows={rows} onNavigate={onNavigate} />;
    if (intent === "signals") return <Signals rows={rows} />;
    if (intent === "opportunities") return <Opportunities rows={rows} />;
    if (intent === "leads") return <Leads rows={rows} />;
    return <Summary data={data || {}} />;
  };

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="مركز أوامر الذكاء الاصطناعي"
      subtitle="استعلم من ذكاء المبيعات المباشر وحوّل بيانات ERP إلى إجراءات مبيعات مركزة."
    >
      <section className="command-v2">
        <div className="command-v2-hero">
          <div className="command-v2-orb"><Sparkles size={31} /></div>
          <div className="command-v2-copy">
            <small>MASA SALES INTELLIGENCE</small>
            <h2>ما الذي تريد من المبيعات الذكية تحليله؟</h2>
            <p>ابحث في الشركات والإشارات والعملاء والفرص مباشرة من مساحة أوامر واحدة.</p>
          </div>
          <div className="command-v2-status">
            <i />
            Intelligence online
          </div>
        </div>

        <div className="command-v2-search">
          <Search size={18} />
          <input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="اسأل ماسة AI عن الحسابات أو الإشارات أو العملاء أو الفرص..."
          />
          {command && !loading && (
            <button type="button" className="command-clear" onClick={() => setCommand("")}>×</button>
          )}
          <Btn onClick={() => run()} disabled={loading || !command.trim()}>
            {loading ? "جارٍ التحليل..." : "تشغيل الأمر"}
          </Btn>
        </div>

        <div className="command-suggestions">
          {SUGGESTIONS.map(({ label, command: value, icon: Icon }) => (
            <button type="button" key={value} onClick={() => run(value)} disabled={loading}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {error && <div className="ai-error">{error}</div>}

        {!result && !loading && (
          <div className="command-welcome">
            <Sparkles size={24} />
            <strong>ابدأ بأمر</strong>
            <span>استخدم أحد الأوامر المقترحة أو اكتب طلبك مباشرة.</span>
          </div>
        )}

        {loading && (
          <div className="command-loading">
            <div className="command-skeleton wide" />
            <div className="command-skeleton" />
            <div className="command-skeleton" />
          </div>
        )}

        {result && !loading && (
          <section className="command-results">
            <header>
              <div>
                <small>RESULT</small>
                <h3>{intent.replaceAll("_", " ")}</h3>
              </div>
              <div className="command-run-meta">
                <Clock3 size={13} />
                <span>{lastCommand}</span>
                {lastRunAt && <time>{lastRunAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>}
              </div>
            </header>
            {renderResult()}
          </section>
        )}
      </section>
    </Shell>
  );
}
