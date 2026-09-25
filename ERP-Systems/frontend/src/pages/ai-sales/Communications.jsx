import { useEffect, useMemo, useState } from "react";
import {
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
} from "lucide-react";

import { Shell, Btn, Panel } from "./shared";
import { aiSalesRequest } from "./aiSalesApi";

export default function Communications({
  onNavigate,
  activeView = "ai-sales-communications",
}) {
  const [rows, setRows] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    company_id: "",
    channel: "email",
    direction: "outbound",
    subject: "",
    body: "",
  });

  /*
  |--------------------------------------------------------------------------
  | Load Data
  |--------------------------------------------------------------------------
  */

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        messagesResponse,
        companiesResponse,
      ] = await Promise.all([
        aiSalesRequest("/communications"),
        aiSalesRequest("/companies"),
      ]);

      setRows(
        messagesResponse?.data ||
          messagesResponse ||
          []
      );

      setCompanies(
        companiesResponse?.data ||
          companiesResponse ||
          []
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load communications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const visible = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      const searchable = [
        row.company?.name,
        row.subject,
        row.body,
        row.channel,
        row.direction,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [rows, search]);

  /*
  |--------------------------------------------------------------------------
  | Save Communication
  |--------------------------------------------------------------------------
  */

  const save = async (event) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await aiSalesRequest(
        "/communications",
        {
          method: "POST",

          body: JSON.stringify({
            company_id:
              form.company_id || null,

            channel:
              form.channel,

            direction:
              form.direction,

            subject:
              form.subject.trim() ||
              null,

            body:
              form.body.trim() ||
              null,

            status:
              "draft",
          }),
        }
      );

      setForm((current) => ({
        ...current,

        subject: "",
        body: "",
      }));

      await load();
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save communication."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | AI Composer Navigation
  |--------------------------------------------------------------------------
  */

  const openAIComposer = () => {
    if (typeof onNavigate === "function") {
      onNavigate(
        "ai-sales-message"
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Channel Icon
  |--------------------------------------------------------------------------
  */

  const channelIcon = (channel) => {
    switch (channel) {
      case "whatsapp":
        return (
          <MessageCircle size={16} />
        );

      case "phone":
        return (
          <Phone size={16} />
        );

      default:
        return (
          <Mail size={16} />
        );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <Shell
      activeView={activeView}
      onNavigate={onNavigate}
      title="مركز الاتصالات"
      subtitle="سجل اتصالات حقيقي وسجلات صادرة معتمدة."
    >
      {/* ================================================================
          TOP ACTIONS
      ================================================================= */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={openAIComposer}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent:
              "center",

            gap: 8,

            padding:
              "10px 16px",

            border: 0,

            borderRadius: 10,

            background:
              "#6657F5",

            color:
              "#ffffff",

            fontSize: 13,

            fontWeight: 700,

            cursor:
              "pointer",

            boxShadow:
              "0 5px 14px rgba(102, 87, 245, 0.18)",
          }}
        >
          <Sparkles size={16} />

          Compose with AI
        </button>
      </div>

      {/* ================================================================
          ERROR
      ================================================================= */}

      {error && (
        <div className="ai-error">
          {error}
        </div>
      )}

      {/* ================================================================
          WORKSPACE
      ================================================================= */}

      <div className="workspace-2">
        {/* ==============================================================
            COMMUNICATION HISTORY
        ============================================================== */}

        <Panel
          title="سجل الاتصالات"
          action={
            <Btn
              secondary
              onClick={load}
            >
              <RefreshCw size={14} />

              Refresh
            </Btn>
          }
        >
          {/* Search */}

          <div className="msg-search">
            <Search size={14} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="ابحث عن شركة أو موضوع أو رسالة..."
            />
          </div>

          {/* Results */}

          <div
            style={{
              display: "grid",
              gap: 8,
              marginTop: 12,
            }}
          >
            {loading ? (
              <p>
                Loading...
              </p>
            ) : visible.length > 0 ? (
              visible.map(
                (row) => (
                  <div
                    className="task-row"
                    key={row.id}
                  >
                    <span>
                      {channelIcon(
                        row.channel
                      )}
                    </span>

                    <div>
                      <b>
                        {row.subject ||
                          row.channel ||
                          "اتصال"}
                      </b>

                      <small>
                        {row.company?.name ||
                          "بدون شركة"}

                        {" • "}

                        {row.body ||
                          "لا يوجد نص للرسالة"}
                      </small>
                    </div>

                    <span>
                      {row.direction ||
                        "outbound"}
                    </span>

                    <em>
                      {row.status ||
                        "draft"}
                    </em>
                  </div>
                )
              )
            ) : (
              <p>
                No communications yet.
              </p>
            )}
          </div>
        </Panel>

        {/* ==============================================================
            LOG COMMUNICATION
        ============================================================== */}

        <Panel title="تسجيل اتصال">
          <form
            className="pro-form"
            onSubmit={save}
          >
            {/* Company */}

            <label>
              Company
            </label>

            <select
              value={
                form.company_id
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    company_id:
                      event.target
                        .value,
                  })
                )
              }
            >
              <option value="">
                No company
              </option>

              {companies.map(
                (company) => (
                  <option
                    key={
                      company.id
                    }
                    value={
                      company.id
                    }
                  >
                    {
                      company.name
                    }
                  </option>
                )
              )}
            </select>

            {/* Channel */}

            <label>
              Channel
            </label>

            <select
              value={
                form.channel
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    channel:
                      event.target
                        .value,
                  })
                )
              }
            >
              <option value="email">
                Email
              </option>

              <option value="whatsapp">
                WhatsApp
              </option>

              <option value="phone">
                Phone
              </option>

              <option value="sms">
                SMS
              </option>

              <option value="meeting">
                Meeting
              </option>

              <option value="other">
                Other
              </option>
            </select>

            {/* Direction */}

            <label>
              Direction
            </label>

            <select
              value={
                form.direction
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    direction:
                      event.target
                        .value,
                  })
                )
              }
            >
              <option value="outbound">
                Outbound
              </option>

              <option value="inbound">
                Inbound
              </option>
            </select>

            {/* Subject */}

            <label>
              Subject
            </label>

            <input
              type="text"
              value={
                form.subject
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    subject:
                      event.target
                        .value,
                  })
                )
              }
            />

            {/* Body */}

            <label>
              Body
            </label>

            <textarea
              rows={6}
              value={
                form.body
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    body:
                      event.target
                        .value,
                  })
                )
              }
            />

            {/* Save */}

            <button
              type="submit"
              disabled={saving}
              style={{
                width: "100%",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap: 7,

                padding:
                  "11px 16px",

                border: 0,

                borderRadius: 8,

                background:
                  saving
                    ? "#9c94f8"
                    : "#6657F5",

                color:
                  "#ffffff",

                fontWeight:
                  700,

                cursor:
                  saving
                    ? "not-allowed"
                    : "pointer",

                opacity:
                  saving
                    ? 0.8
                    : 1,
              }}
            >
              <Send size={14} />

              {saving
                ? "جارٍ الحفظ..."
                : "حفظ المسودة"}
            </button>
          </form>
        </Panel>
      </div>
    </Shell>
  );
}