import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  Clock3,
  WalletCards,
  Eye,
  Printer,
  X,
  Building2,
  FolderKanban,
  CalendarDays,
  UserRound,
  Phone,
  Mail,
  MapPin,
  BadgeDollarSign,
  ChevronLeft,
  RefreshCw,
  CircleDollarSign,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const statusMeta = {
  draft: { label: "مسودة", tone: "orange" },
  under_review: { label: "قيد المراجعة", tone: "blue" },
  pending_approval: { label: "بانتظار الموافقة", tone: "blue" },
  approved: { label: "معتمد", tone: "green" },
  rejected: { label: "مرفوض", tone: "red" },
  expired: { label: "منتهي", tone: "gray" },
};

const money = (value) =>
  Number(value || 0).toLocaleString("ar-SA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateText = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const dateTimeText = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export default function Quotations({ onOpenProject }) {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [versionFilter, setVersionFilter] = useState("all");

  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(`${API_URL}/quotations`, {
        headers: { Accept: "application/json" },
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "تعذر تحميل عروض الأسعار");
      }

      setQuotations(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error(error);
      setLoadError(error.message || "حدث خطأ أثناء تحميل عروض الأسعار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const stats = useMemo(() => {
    const total = quotations.length;
    const draft = quotations.filter((q) => q.status === "draft").length;
    const approvedRows = quotations.filter((q) => q.status === "approved");
    const approved = approvedRows.length;
    const approvedValue = approvedRows.reduce(
      (sum, q) => sum + Number(q.total || 0),
      0
    );

    return { total, draft, approved, approvedValue };
  }, [quotations]);

  const projects = useMemo(() => {
    const map = new Map();
    quotations.forEach((row) => {
      if (row.project?.id) {
        map.set(row.project.id, row.project);
      }
    });
    return Array.from(map.values());
  }, [quotations]);

  const versions = useMemo(() => {
    return Array.from(
      new Set(quotations.map((row) => Number(row.version || 1)))
    ).sort((a, b) => a - b);
  }, [quotations]);

  const filteredQuotations = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return quotations.filter((row) => {
      const project = row.project || {};
      const matchesSearch =
        !needle ||
        [
          row.quotation_number,
          project.name,
          project.project_code,
          project.customer_name,
          project.customer_code,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));

      const matchesStatus =
        statusFilter === "all" || row.status === statusFilter;

      const matchesProject =
        projectFilter === "all" ||
        String(project.id) === String(projectFilter);

      const matchesVersion =
        versionFilter === "all" ||
        String(row.version) === String(versionFilter);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject &&
        matchesVersion
      );
    });
  }, [
    quotations,
    search,
    statusFilter,
    projectFilter,
    versionFilter,
  ]);

  const openQuotation = async (row) => {
    const projectId = row.project?.id || row.project_id;

    if (!projectId) {
      setDetailError("تعذر تحديد المشروع المرتبط بعرض السعر.");
      return;
    }

    try {
      setSelectedQuotation(row);
      setDetailLoading(true);
      setDetailError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/quotations/${row.id}`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "تعذر تحميل تفاصيل عرض السعر");
      }

      setSelectedQuotation({
        ...row,
        ...result.data,
        project: row.project,
      });
    } catch (error) {
      console.error(error);
      setDetailError(error.message || "حدث خطأ أثناء تحميل التفاصيل");
    } finally {
      setDetailLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setProjectFilter("all");
    setVersionFilter("all");
  };

  const printQuotation = async (quotation) => {
    if (!quotation) return;

    const projectId = quotation.project?.id || quotation.project_id;

    if (!projectId || !quotation.id) {
      renderQuotationPrint(quotation);
      return;
    }

    try {
      /*
       * نطبع دائمًا من أحدث نسخة محفوظة في قاعدة البيانات.
       * مهم جدًا لأن صف جدول عروض الأسعار قد يحتوي بيانات مختصرة/قديمة،
       * وخصوصًا commercial_terms.
       */
      const response = await fetch(
        `${API_URL}/projects/${projectId}/quotations/${quotation.id}`,
        { headers: { Accept: "application/json" } }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result?.message || "تعذر تحميل أحدث بيانات عرض السعر.");
      }

      const freshQuotation = {
        ...quotation,
        ...(result?.data || {}),
        project: quotation.project || result?.data?.project || {},
      };

      setSelectedQuotation((current) =>
        current?.id === freshQuotation.id ? freshQuotation : current
      );

      renderQuotationPrint(freshQuotation);
    } catch (error) {
      console.error("Print quotation refresh error:", error);
      window.alert(
        error?.message ||
          "تعذر تحميل أحدث بيانات عرض السعر قبل الطباعة."
      );
    }
  };

  const renderQuotationPrint = (quotation) => {
    if (!quotation) return;

    const project = quotation.project || {};
    const items = quotation.items || [];
    const commercial = quotation.commercial_terms || {};
    const status =
      statusMeta[quotation.status]?.label || quotation.status || "—";

    const esc = (value) =>
      String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

    const sectionGroups = items.reduce((groups, item) => {
      const section = item.section || "عام";
      if (!groups[section]) groups[section] = [];
      groups[section].push(item);
      return groups;
    }, {});

    const rowsHtml = Object.entries(sectionGroups)
      .map(([section, rows]) => {
        const sectionRow =
          Object.keys(sectionGroups).length > 1
            ? `<tr class="section-row"><td colspan="7">${esc(section)}</td></tr>`
            : "";

        return (
          sectionRow +
          rows
            .map(
              (item, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td class="item-cell">
                    <strong>${esc(
                      item.product_name || item.product?.name || "—"
                    )}</strong>
                    ${
                      item.description
                        ? `<div class="item-desc">${esc(item.description)}</div>`
                        : ""
                    }
                    ${
                      item.sku
                        ? `<div class="sku">${esc(item.sku)}</div>`
                        : ""
                    }
                  </td>
                  <td class="center">${esc(item.unit || "قطعة")}</td>
                  <td class="center">${money(item.quantity)}</td>
                  <td class="money">${money(item.unit_price)}</td>
                  <td class="money">${money(item.discount)}</td>
                  <td class="money strong">${money(item.line_total)}</td>
                </tr>
              `
            )
            .join("")
        );
      })
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(quotation.quotation_number || "Quotation")}</title>
<style>
  *{box-sizing:border-box}
  :root{
    --purple:#6657f5;
    --purple-dark:#4f46d8;
    --purple-soft:#f3f1ff;
    --ink:#171b2d;
    --muted:#7e8798;
    --line:#e7e9f0;
    --soft:#f8f9fc;
    --green:#16855f;
  }
  body{
    margin:0;
    background:#eef0f5;
    color:var(--ink);
    font-family:Arial,Tahoma,sans-serif;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }
  .toolbar{
    position:sticky;
    top:0;
    z-index:20;
    display:flex;
    justify-content:center;
    gap:10px;
    padding:12px;
    background:rgba(238,240,245,.96);
    border-bottom:1px solid #dfe2e9;
  }
  .toolbar button{
    border:0;
    border-radius:10px;
    padding:10px 18px;
    cursor:pointer;
    font:700 13px Arial,Tahoma,sans-serif;
  }
  .print-btn{background:var(--purple);color:#fff}
  .close-btn{background:#fff;color:#555;border:1px solid #ddd!important}
  .sheet{
    width:210mm;
    min-height:297mm;
    margin:18px auto;
    background:#fff;
    padding:15mm 14mm 13mm;
    box-shadow:0 12px 40px rgba(27,31,44,.10);
    position:relative;
    overflow:hidden;
  }
  .sheet:before{
    content:"";
    position:absolute;
    width:170px;
    height:170px;
    border-radius:50%;
    background:var(--purple-soft);
    left:-90px;
    top:-90px;
  }
  .top{
    display:flex;
    justify-content:space-between;
    align-items:flex-start;
    gap:25px;
    padding-bottom:18px;
    border-bottom:2px solid var(--purple);
    position:relative;
  }
  .brand-wrap{display:flex;align-items:center;gap:12px}
  .logo{
    width:48px;height:48px;border-radius:14px;
    background:var(--purple);color:#fff;
    display:grid;place-items:center;
    font-size:25px;font-weight:900;
    box-shadow:0 8px 20px rgba(102,87,245,.20);
  }
  .brand{font-size:23px;font-weight:900;letter-spacing:.4px}
  .brand small{display:block;color:var(--muted);font-size:10px;font-weight:700;margin-top:4px}
  .doc{text-align:left}
  .doc-label{color:var(--purple);font-size:11px;font-weight:900;letter-spacing:.8px}
  .doc-number{font-size:19px;font-weight:900;margin-top:5px}
  .status{
    display:inline-block;margin-top:7px;padding:5px 9px;border-radius:999px;
    background:#eaf9f2;color:var(--green);font-size:9px;font-weight:900;
  }
  .hero{
    display:grid;grid-template-columns:1.25fr .75fr;gap:12px;margin-top:17px;
  }
  .box{
    border:1px solid var(--line);border-radius:13px;padding:13px;background:#fff;
  }
  .box.soft{background:var(--soft)}
  .box-title{font-size:10px;color:var(--purple);font-weight:900;margin-bottom:9px}
  .client-name{font-size:17px;font-weight:900;margin-bottom:7px}
  .project-name{font-size:14px;font-weight:900;margin-bottom:8px}
  .meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px 16px}
  .meta{font-size:9px;line-height:1.65;color:var(--muted)}
  .meta strong{color:var(--ink);font-weight:800}
  .quote-info{
    display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0 0;
  }
  .info-chip{
    padding:9px 10px;border-radius:10px;background:var(--purple-soft);
    border:1px solid #e8e4ff;
  }
  .info-chip span{display:block;color:#8b84c2;font-size:8px;font-weight:800}
  .info-chip strong{display:block;margin-top:4px;font-size:9px}
  table{width:100%;border-collapse:separate;border-spacing:0;margin-top:17px;font-size:9px}
  thead th{
    background:#27283a;color:#fff;padding:9px 7px;font-weight:800;text-align:right;
    border-left:1px solid rgba(255,255,255,.08)
  }
  thead th:first-child{border-radius:0 8px 8px 0}
  thead th:last-child{border-radius:8px 0 0 8px}
  tbody td{padding:9px 7px;border-bottom:1px solid var(--line);vertical-align:top}
  tbody tr:nth-child(even):not(.section-row){background:#fbfbfd}
  .section-row td{
    background:var(--purple-soft);color:var(--purple-dark);font-weight:900;
    padding:7px 9px;border-bottom:1px solid #ded9ff
  }
  .center{text-align:center}.money{text-align:left;white-space:nowrap}.strong{font-weight:900}
  .item-cell strong{font-size:9.5px}
  .item-desc{font-size:8px;color:var(--muted);margin-top:3px;line-height:1.5}
  .sku{font-size:7.5px;color:#a2a8b4;margin-top:3px}
  .bottom{
    display:grid;grid-template-columns:1fr 285px;gap:18px;margin-top:16px;align-items:start;
  }
  .terms{
    border:1px solid var(--line);border-radius:12px;padding:12px;background:#fcfcfe;
    font-size:8.5px;line-height:1.8;color:#6f7788;
  }
  .terms h3{margin:0 0 6px;color:var(--ink);font-size:10px}
  .terms ul{margin:5px 0 0;padding-right:17px}
  .totals{border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .total-row{display:flex;justify-content:space-between;gap:12px;padding:9px 11px;border-bottom:1px solid var(--line);font-size:9px}
  .total-row span{color:var(--muted)}
  .total-row.grand{background:var(--purple);color:#fff;font-size:12px;font-weight:900;border:0}
  .total-row.grand span{color:#fff}
  .notes{margin-top:13px;padding:11px;border-radius:10px;background:#fff8eb;border:1px solid #fde3b1;font-size:8.5px;line-height:1.7}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:45px;margin-top:30px}
  .sign{text-align:center;color:#7f8797;font-size:9px}
  .sign-line{height:40px;border-bottom:1px solid #bfc4ce;margin-bottom:6px}
  .footer{
    margin-top:28px;padding-top:10px;border-top:1px solid var(--line);
    display:flex;justify-content:space-between;gap:15px;color:#9aa1ae;font-size:7.5px;
  }
  @page{size:A4;margin:0}
  @media print{
    body{background:#fff}
    .toolbar{display:none!important}
    .sheet{margin:0;box-shadow:none;width:210mm;min-height:297mm}
  }
</style>
</head>
<body>
  <div class="toolbar no-print">
    <button class="print-btn" onclick="window.print()">طباعة / حفظ PDF</button>
    <button class="close-btn" onclick="window.close()">إغلاق المعاينة</button>
  </div>

  <main class="sheet">
    <header class="top">
      <div class="brand-wrap">
        <div class="logo">M</div>
        <div class="brand">
          MASA ERP
          <small>Business Management Solutions</small>
        </div>
      </div>

      <div class="doc">
        <div class="doc-label">QUOTATION / عرض سعر</div>
        <div class="doc-number">${esc(quotation.quotation_number || "—")}</div>
        <div class="status">${esc(status)} • V${esc(quotation.version || 1)}</div>
      </div>
    </header>

    <section class="hero">
      <div class="box">
        <div class="box-title">مقدم إلى / CUSTOMER</div>
        <div class="client-name">${esc(project.customer_name || "—")}</div>
        <div class="meta-grid">
          <div class="meta">كود العميل: <strong>${esc(project.customer_code || "—")}</strong></div>
          <div class="meta">الجوال: <strong>${esc(project.phone || "—")}</strong></div>
          <div class="meta">البريد: <strong>${esc(project.email || "—")}</strong></div>
          <div class="meta">الرقم الضريبي: <strong>${esc(project.tax_number || "—")}</strong></div>
          <div class="meta" style="grid-column:1/-1">العنوان: <strong>${esc(project.address || "—")}</strong></div>
        </div>
      </div>

      <div class="box soft">
        <div class="box-title">PROJECT / المشروع</div>
        <div class="project-name">${esc(project.name || "—")}</div>
        <div class="meta">كود المشروع: <strong>${esc(project.project_code || "—")}</strong></div>
        <div class="meta">مدير المشروع: <strong>${esc(project.project_manager || "—")}</strong></div>
        <div class="meta">مسؤول العميل: <strong>${esc(project.account_manager || "—")}</strong></div>
      </div>
    </section>

    <section class="quote-info">
      <div class="info-chip"><span>تاريخ العرض</span><strong>${esc(dateText(quotation.created_at))}</strong></div>
      <div class="info-chip"><span>صالح حتى</span><strong>${esc(dateText(quotation.valid_until))}</strong></div>
      <div class="info-chip"><span>الإصدار</span><strong>V${esc(quotation.version || 1)}</strong></div>
      <div class="info-chip"><span>رقم طلب العميل / RFQ</span><strong>${esc(commercial.customer_rfq || "—")}</strong></div>
    </section>

    <table>
      <thead>
        <tr>
          <th style="width:34px">#</th>
          <th>الوصف / Description</th>
          <th style="width:62px">الوحدة</th>
          <th style="width:58px">الكمية</th>
          <th style="width:82px">سعر الوحدة</th>
          <th style="width:72px">الخصم</th>
          <th style="width:90px">الإجمالي</th>
        </tr>
      </thead>
      <tbody>${rowsHtml || '<tr><td colspan="7" class="center">لا توجد بنود</td></tr>'}</tbody>
    </table>

    <section class="bottom">
      <div>
        <div class="terms">
          <h3>الشروط والأحكام</h3>
          <ul>
            <li><strong>شروط الدفع:</strong> ${esc(commercial.payment_terms || "حسب الاتفاق المعتمد مع العميل")}</li>
            <li><strong>مدة التوريد:</strong> ${esc(commercial.delivery_period || "يتم تحديدها حسب توفر المواد وبعد اعتماد الطلب")}</li>
            <li><strong>مدة التنفيذ:</strong> ${esc(commercial.execution_period || "يتم تحديدها حسب نطاق الأعمال والكميات وموقع المشروع")}</li>
            <li><strong>الضمان:</strong> ${esc(commercial.warranty || "حسب شروط الضمان الخاصة بالمنتجات والأعمال المقدمة")}</li>
            <li>الأسعار بالريال السعودي، وتطبق ضريبة القيمة المضافة وفق الأنظمة المعمول بها.</li>
            <li>أي أعمال أو كميات إضافية غير مدرجة في هذا العرض يتم تسعيرها بشكل منفصل بعد موافقة العميل.</li>
          </ul>
          ${commercial.custom_terms ? `<div style="margin-top:7px"><strong>شروط إضافية:</strong> ${esc(commercial.custom_terms)}</div>` : ""}
        </div>

        ${
          quotation.notes
            ? `<div class="notes"><strong>ملاحظات:</strong> ${esc(quotation.notes)}</div>`
            : ""
        }
      </div>

      <div class="totals">
        <div class="total-row"><span>الإجمالي قبل الضريبة</span><strong>${money(quotation.subtotal)} ر.س</strong></div>
        <div class="total-row"><span>الخصم</span><strong>${money(quotation.discount)} ر.س</strong></div>
        <div class="total-row"><span>ضريبة القيمة المضافة</span><strong>${money(quotation.tax)} ر.س</strong></div>
        <div class="total-row grand"><span>الإجمالي الكلي</span><strong>${money(quotation.total)} ر.س</strong></div>
      </div>
    </section>

    ${
      quotation.revision_reason
        ? `<div class="notes"><strong>ملاحظة الإصدار:</strong> ${esc(quotation.revision_reason)}</div>`
        : ""
    }

    <section class="signatures">
      <div class="sign">
        <div class="sign-line"></div>
        اعتماد العميل / Customer Approval
      </div>
      <div class="sign">
        <div class="sign-line"></div>
        اعتماد الشركة / Authorized Signature
      </div>
    </section>

    <footer class="footer">
      <span>MASA ERP • Quotation ${esc(quotation.quotation_number || "")}${commercial.prepared_by ? ` • Prepared by: ${esc(commercial.prepared_by)}` : ""}</span>
      <span>تم إنشاء المستند إلكترونيًا بواسطة MASA ERP</span>
    </footer>
  </main>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="qt-page" dir="rtl">
      <style>{`
        .qt-page {
          --qt-purple: #6457f5;
          --qt-purple-soft: #f0efff;
          --qt-text: #171b2c;
          --qt-muted: #8b92a3;
          --qt-border: #e8ebf2;
          --qt-bg: #f7f8fc;
          min-height: 100%;
          color: var(--qt-text);
        }

        .qt-page * { box-sizing: border-box; }

        .qt-page button,
        .qt-page input,
        .qt-page select {
          font-family: inherit;
        }

        .qt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .qt-title h1 {
          margin: 0;
          font-size: 27px;
          line-height: 1.2;
          font-weight: 900;
          color: #111827;
        }

        .qt-title p {
          margin: 7px 0 0;
          font-size: 12px;
          color: var(--qt-muted);
        }

        .qt-refresh {
          border: 1px solid var(--qt-border);
          background: #fff;
          border-radius: 11px;
          height: 42px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #626b7e;
          cursor: pointer;
          font-weight: 800;
        }

        .qt-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }

        .qt-card {
          background: #fff;
          border: 1px solid var(--qt-border);
          border-radius: 16px;
          padding: 16px;
          min-height: 116px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          position: relative;
          overflow: hidden;
        }

        .qt-card::after {
          content: "";
          position: absolute;
          width: 82px;
          height: 82px;
          border-radius: 999px;
          left: -28px;
          top: -30px;
          background: rgba(100, 87, 245, 0.05);
        }

        .qt-card-label {
          color: #8b92a3;
          font-size: 11px;
          font-weight: 700;
        }

        .qt-card-value {
          margin-top: 13px;
          font-size: 26px;
          line-height: 1;
          font-weight: 900;
          color: #111827;
        }

        .qt-card-value.money {
          font-size: 20px;
        }

        .qt-card-sub {
          margin-top: 9px;
          font-size: 10px;
          color: #9ba1ae;
        }

        .qt-card-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }

        .qt-card-icon.purple { background:#efedff; color:#6257f5; }
        .qt-card-icon.orange { background:#fff2e5; color:#f59e0b; }
        .qt-card-icon.green { background:#e9fbf3; color:#18a66c; }
        .qt-card-icon.blue { background:#edf5ff; color:#4385f5; }

        .qt-panel {
          background: #fff;
          border: 1px solid var(--qt-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .qt-filters {
          padding: 15px;
          border-bottom: 1px solid var(--qt-border);
          display: grid;
          grid-template-columns: minmax(280px, 1.5fr) repeat(3, minmax(130px, .65fr)) auto;
          gap: 10px;
          align-items: center;
        }

        .qt-search {
          position: relative;
        }

        .qt-search svg {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #9aa1b0;
          pointer-events: none;
        }

        .qt-search input,
        .qt-filter-select {
          width: 100%;
          height: 42px;
          border: 1px solid #e3e6ee;
          border-radius: 11px;
          background: #fff;
          outline: none;
          color: #333a4c;
          font-size: 11px;
        }

        .qt-search input {
          padding: 0 40px 0 12px;
        }

        .qt-filter-select {
          padding: 0 11px;
          cursor: pointer;
        }

        .qt-clear {
          height: 42px;
          border-radius: 11px;
          border: 1px solid #e3e6ee;
          background: #fafbfe;
          color: #747d90;
          padding: 0 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          white-space: nowrap;
        }

        .qt-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .qt-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .qt-table th {
          height: 46px;
          padding: 0 12px;
          text-align: right;
          font-size: 10px;
          color: #8b92a3;
          font-weight: 800;
          background: #fbfcff;
          border-bottom: 1px solid var(--qt-border);
        }

        .qt-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f2f6;
          font-size: 11px;
          vertical-align: middle;
          color: #333a4c;
        }

        .qt-table tbody tr {
          transition: background .15s ease;
        }

        .qt-table tbody tr:hover {
          background: #fbfbff;
        }

        .qt-number {
          display: flex;
          align-items: center;
          gap: 8px;
          direction: ltr;
          justify-content: flex-end;
          color: #584cf4;
          font-weight: 900;
          white-space: nowrap;
        }

        .qt-number-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #f0efff;
          color: #6557f6;
          flex: 0 0 auto;
        }

        .qt-version {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 34px;
          height: 27px;
          padding: 0 9px;
          border-radius: 8px;
          background: #f3f4f8;
          font-weight: 900;
          direction: ltr;
        }

        .qt-project-name {
          font-weight: 900;
          color: #22293a;
        }

        .qt-project-code {
          margin-top: 4px;
          color: #695df5;
          font-size: 9px;
          direction: ltr;
          text-align: right;
        }

        .qt-customer {
          font-weight: 700;
        }

        .qt-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 9px;
          font-weight: 900;
          white-space: nowrap;
        }

        .qt-status.green { background:#eafaf2; color:#168353; }
        .qt-status.orange { background:#fff2e5; color:#dd7a08; }
        .qt-status.blue { background:#edf5ff; color:#3579de; }
        .qt-status.red { background:#fff0f0; color:#d94747; }
        .qt-status.gray { background:#f2f3f5; color:#747b87; }

        .qt-money {
          font-weight: 900;
          color: #20283a;
          white-space: nowrap;
        }

        .qt-money small {
          display: block;
          margin-top: 3px;
          color: #9ba1ae;
          font-size: 8px;
          font-weight: 600;
        }

        .qt-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .qt-icon-btn {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border: 1px solid #e3e6ee;
          border-radius: 9px;
          background: #fff;
          color: #6d7486;
          cursor: pointer;
        }

        .qt-icon-btn.primary {
          color: #6557f6;
          background: #f7f6ff;
          border-color: #e4e1ff;
        }

        .qt-empty,
        .qt-loading,
        .qt-error {
          padding: 55px 20px;
          text-align: center;
          color: #8b92a3;
          font-size: 12px;
        }

        .qt-error { color: #d94141; }

        .qt-footer {
          min-height: 52px;
          padding: 0 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #9aa1ae;
          font-size: 10px;
        }

        .qt-detail-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(22, 27, 45, .32);
          padding: 24px;
          overflow-y: auto;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .qt-detail {
          width: min(1120px, 100%);
          margin: 25px auto;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 24px 80px rgba(30, 36, 60, .2);
          overflow: hidden;
          border: 1px solid #edf0f5;
        }

        .qt-detail-head {
          min-height: 74px;
          padding: 15px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          border-bottom: 1px solid #edf0f5;
        }

        .qt-detail-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .qt-detail-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          color: #6557f6;
          background: #f0efff;
          flex: 0 0 auto;
        }

        .qt-detail-number {
          font-size: 16px;
          font-weight: 900;
          direction: ltr;
          text-align: right;
          white-space: nowrap;
        }

        .qt-detail-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .qt-detail-btn {
          height: 38px;
          border-radius: 10px;
          padding: 0 13px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          font-weight: 800;
          font-size: 10px;
          border: 1px solid #e3e6ee;
          background: #fff;
          color: #596174;
        }

        .qt-detail-btn.print {
          background: #6557f6;
          color: #fff;
          border-color: #6557f6;
        }

        .qt-detail-close {
          width: 38px;
          padding: 0;
          justify-content: center;
        }

        .qt-detail-body {
          padding: 17px;
          background: #fbfcff;
        }

        .qt-client-project {
          display: grid;
          grid-template-columns: 1fr 1fr 0.7fr;
          gap: 12px;
          margin-bottom: 14px;
        }

        .qt-info-card {
          background: #fff;
          border: 1px solid #e8ebf2;
          border-radius: 14px;
          padding: 14px;
        }

        .qt-info-title {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 13px;
          font-size: 11px;
          font-weight: 900;
          color: #3a4255;
        }

        .qt-info-title svg { color:#6557f6; }

        .qt-info-line {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px dashed #f0f1f5;
          font-size: 10px;
        }

        .qt-info-line:last-child { border-bottom:0; }
        .qt-info-line span { color:#969dab; }
        .qt-info-line strong { color:#313849; font-weight:800; }

        .qt-total-card {
          background:
            linear-gradient(145deg, #f8f7ff 0%, #fff 75%);
        }

        .qt-big-total {
          margin: 12px 0 5px;
          font-size: 25px;
          font-weight: 900;
          color: #1f2637;
        }

        .qt-big-total span {
          font-size: 11px;
          color: #8d94a4;
          font-weight: 700;
        }

        .qt-items-card {
          background: #fff;
          border: 1px solid #e8ebf2;
          border-radius: 14px;
          overflow: hidden;
        }

        .qt-items-head {
          padding: 14px 15px;
          border-bottom: 1px solid #edf0f5;
          font-size: 12px;
          font-weight: 900;
        }

        .qt-items-table-wrap { overflow-x:auto; }

        .qt-items-table {
          width: 100%;
          min-width: 820px;
          border-collapse: collapse;
        }

        .qt-items-table th {
          padding: 10px;
          background: #fafbfe;
          border-bottom: 1px solid #e9ecf2;
          color: #8d94a4;
          font-size: 9px;
          text-align: right;
        }

        .qt-items-table td {
          padding: 11px 10px;
          border-bottom: 1px solid #f0f2f6;
          font-size: 10px;
          color: #3b4253;
        }

        .qt-items-table tbody tr:last-child td { border-bottom:0; }

        .qt-detail-bottom {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 12px;
          margin-top: 12px;
        }

        .qt-note-card,
        .qt-totals-card {
          background:#fff;
          border:1px solid #e8ebf2;
          border-radius:14px;
          padding:14px;
        }

        .qt-reason {
          background:#fff8ee;
          border:1px solid #fed7aa;
          color:#9a5b16;
          padding:10px 11px;
          border-radius:10px;
          font-size:10px;
          line-height:1.7;
          margin-bottom:9px;
        }

        .qt-note {
          color:#71798b;
          font-size:10px;
          line-height:1.8;
        }

        .qt-total-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:8px 0;
          border-bottom:1px solid #f0f2f6;
          font-size:10px;
        }

        .qt-total-row:last-child { border-bottom:0; }

        .qt-total-row span { color:#9299a8; }

        .qt-total-row strong { color:#2c3447; }

        .qt-total-row.grand {
          margin-top:4px;
          padding-top:12px;
          font-size:13px;
        }

        .qt-total-row.grand strong { color:#6557f6; font-size:16px; }

        @media (max-width: 1180px) {
          .qt-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .qt-filters { grid-template-columns: 1fr 1fr; }
          .qt-client-project { grid-template-columns: 1fr 1fr; }
          .qt-total-card { grid-column: 1 / -1; }
        }

        @media (max-width: 760px) {
          .qt-header { align-items:flex-start; }
          .qt-cards { grid-template-columns:1fr; }
          .qt-filters { grid-template-columns:1fr; }
          .qt-detail-backdrop { padding:10px; }
          .qt-client-project { grid-template-columns:1fr; }
          .qt-total-card { grid-column:auto; }
          .qt-detail-bottom { grid-template-columns:1fr; }
          .qt-detail-head { align-items:flex-start; flex-direction:column; }
          .qt-detail-actions { width:100%; flex-wrap:wrap; }
        }

        .qt-commercial-card{
          background:#fff;
          border:1px solid #e9ebf2;
          border-radius:16px;
          padding:16px;
          margin-top:14px;
        }
        .qt-commercial-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          margin-bottom:12px;
        }
        .qt-commercial-head strong{
          font-size:13px;
          color:#242b3c;
        }
        .qt-commercial-head span{
          font-size:9px;
          color:#9aa1af;
        }
        .qt-commercial-grid{
          display:grid;
          grid-template-columns:repeat(3,minmax(0,1fr));
          gap:10px;
        }
        .qt-commercial-item{
          border:1px solid #edf0f5;
          background:#fbfbfd;
          border-radius:11px;
          padding:11px 12px;
          min-height:58px;
        }
        .qt-commercial-item span{
          display:block;
          font-size:8px;
          color:#9aa1af;
          margin-bottom:5px;
        }
        .qt-commercial-item strong{
          display:block;
          font-size:10px;
          color:#343b50;
          line-height:1.7;
          white-space:pre-wrap;
          word-break:break-word;
        }
        .qt-commercial-item.full{
          grid-column:1/-1;
        }
        @media(max-width:900px){
          .qt-commercial-grid{grid-template-columns:1fr 1fr}
        }
        @media(max-width:620px){
          .qt-commercial-grid{grid-template-columns:1fr}
          .qt-commercial-item.full{grid-column:auto}
        }

      `}</style>

      <div className="qt-header">
        <div className="qt-title">
          <h1>عروض الأسعار</h1>
          <p>عرض وإدارة جميع عروض الأسعار وربط كل عرض بالمشروع والعميل.</p>
        </div>

        <button
          type="button"
          className="qt-refresh"
          onClick={loadQuotations}
          disabled={loading}
        >
          <RefreshCw size={16} />
          تحديث
        </button>
      </div>

      <div className="qt-cards">
        <div className="qt-card">
          <div>
            <div className="qt-card-label">إجمالي عروض الأسعار</div>
            <div className="qt-card-value">{stats.total}</div>
            <div className="qt-card-sub">كل الإصدارات المسجلة بالنظام</div>
          </div>
          <div className="qt-card-icon blue">
            <FileText size={21} />
          </div>
        </div>

        <div className="qt-card">
          <div>
            <div className="qt-card-label">العروض المسودة</div>
            <div className="qt-card-value">{stats.draft}</div>
            <div className="qt-card-sub">تحتاج استكمال أو اعتماد</div>
          </div>
          <div className="qt-card-icon orange">
            <Clock3 size={21} />
          </div>
        </div>

        <div className="qt-card">
          <div>
            <div className="qt-card-label">العروض المعتمدة</div>
            <div className="qt-card-value">{stats.approved}</div>
            <div className="qt-card-sub">إصدارات تم اعتمادها</div>
          </div>
          <div className="qt-card-icon green">
            <CheckCircle2 size={21} />
          </div>
        </div>

        <div className="qt-card">
          <div>
            <div className="qt-card-label">قيمة العروض المعتمدة</div>
            <div className="qt-card-value money">
              {money(stats.approvedValue)}
            </div>
            <div className="qt-card-sub">ريال سعودي</div>
          </div>
          <div className="qt-card-icon purple">
            <WalletCards size={21} />
          </div>
        </div>
      </div>

      <div className="qt-panel">
        <div className="qt-filters">
          <div className="qt-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم العرض أو اسم المشروع أو العميل..."
            />
          </div>

          <select
            className="qt-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="under_review">قيد المراجعة</option>
            <option value="approved">معتمد</option>
            <option value="rejected">مرفوض</option>
            <option value="expired">منتهي</option>
          </select>

          <select
            className="qt-filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">كل المشاريع</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} — {project.project_code}
              </option>
            ))}
          </select>

          <select
            className="qt-filter-select"
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
          >
            <option value="all">كل الإصدارات</option>
            {versions.map((version) => (
              <option key={version} value={version}>
                V{version}
              </option>
            ))}
          </select>

          <button type="button" className="qt-clear" onClick={clearFilters}>
            <SlidersHorizontal size={15} />
            مسح الفلاتر
          </button>
        </div>

        {loading ? (
          <div className="qt-loading">جاري تحميل عروض الأسعار...</div>
        ) : loadError ? (
          <div className="qt-error">{loadError}</div>
        ) : filteredQuotations.length === 0 ? (
          <div className="qt-empty">لا توجد عروض أسعار مطابقة.</div>
        ) : (
          <div className="qt-table-wrap">
            <table className="qt-table">
              <thead>
                <tr>
                  <th>رقم العرض</th>
                  <th>الإصدار</th>
                  <th>المشروع</th>
                  <th>العميل</th>
                  <th>الحالة</th>
                  <th>القيمة الإجمالية</th>
                  <th>تاريخ الإنشاء</th>
                  <th>آخر اعتماد</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredQuotations.map((row) => {
                  const meta =
                    statusMeta[row.status] || {
                      label: row.status || "—",
                      tone: "gray",
                    };

                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="qt-number">
                          <span>{row.quotation_number}</span>
                          <span className="qt-number-icon">
                            <FileText size={14} />
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="qt-version">
                          V{row.version || 1}
                        </span>
                      </td>

                      <td>
                        <div className="qt-project-name">
                          {row.project?.name || "—"}
                        </div>
                        <div className="qt-project-code">
                          {row.project?.project_code || "—"}
                        </div>
                      </td>

                      <td>
                        <div className="qt-customer">
                          {row.project?.customer_name || "—"}
                        </div>
                        <div
                          style={{
                            color: "#9ba1ae",
                            marginTop: 4,
                            fontSize: 9,
                          }}
                        >
                          {row.project?.customer_code || ""}
                        </div>
                      </td>

                      <td>
                        <span className={`qt-status ${meta.tone}`}>
                          <CheckCircle2 size={11} />
                          {meta.label}
                        </span>
                      </td>

                      <td>
                        <div className="qt-money">
                          {money(row.total)}
                          <small>ر.س</small>
                        </div>
                      </td>

                      <td>{dateTimeText(row.created_at)}</td>
                      <td>{dateTimeText(row.approved_at)}</td>

                      <td>
                        <div className="qt-actions">
                          <button
                            type="button"
                            className="qt-icon-btn primary"
                            title="فتح التفاصيل"
                            onClick={() => openQuotation(row)}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            type="button"
                            className="qt-icon-btn"
                            title="طباعة"
                            onClick={() => printQuotation(row)}
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="qt-footer">
          <span>
            عرض {filteredQuotations.length} من {quotations.length} عرض
          </span>
          <span>جميع الإصدارات محفوظة كسجل تاريخي</span>
        </div>
      </div>

      {selectedQuotation && (
        <div
          className="qt-detail-backdrop"
          onClick={() => setSelectedQuotation(null)}
        >
          <div className="qt-detail" onClick={(e) => e.stopPropagation()}>
            <div className="qt-detail-head">
              <div className="qt-detail-title">
                <div className="qt-detail-title-icon">
                  <FileText size={20} />
                </div>

                <div>
                  <div className="qt-detail-number">
                    {selectedQuotation.quotation_number}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      display: "flex",
                      gap: 7,
                      alignItems: "center",
                    }}
                  >
                    <span
                      className={`qt-status ${
                        statusMeta[selectedQuotation.status]?.tone || "gray"
                      }`}
                    >
                      {statusMeta[selectedQuotation.status]?.label ||
                        selectedQuotation.status}
                    </span>
                    <span className="qt-version">
                      V{selectedQuotation.version || 1}
                    </span>
                  </div>
                </div>
              </div>

              <div className="qt-detail-actions">
                {onOpenProject && (
                  <button
                    type="button"
                    className="qt-detail-btn"
                    onClick={() =>
                      onOpenProject(
                        selectedQuotation.project?.id ||
                          selectedQuotation.project_id
                      )
                    }
                  >
                    <FolderKanban size={14} />
                    فتح المشروع
                    <ChevronLeft size={13} />
                  </button>
                )}

                <button
                  type="button"
                  className="qt-detail-btn print"
                  onClick={() => printQuotation(selectedQuotation)}
                >
                  <Printer size={14} />
                  طباعة العرض
                </button>

                <button
                  type="button"
                  className="qt-detail-btn qt-detail-close"
                  onClick={() => setSelectedQuotation(null)}
                  title="إغلاق"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="qt-detail-body">
              {detailLoading ? (
                <div className="qt-loading">جاري تحميل التفاصيل...</div>
              ) : detailError ? (
                <div className="qt-error">{detailError}</div>
              ) : (
                <>
                  <div className="qt-client-project">
                    <div className="qt-info-card">
                      <div className="qt-info-title">
                        <Building2 size={15} />
                        بيانات العميل
                      </div>

                      <div className="qt-info-line">
                        <span>اسم العميل</span>
                        <strong>
                          {selectedQuotation.project?.customer_name || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>كود العميل</span>
                        <strong>
                          {selectedQuotation.project?.customer_code || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>
                          <Phone size={11} style={{ verticalAlign: "middle" }} />{" "}
                          الجوال
                        </span>
                        <strong>
                          {selectedQuotation.project?.phone || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>
                          <Mail size={11} style={{ verticalAlign: "middle" }} />{" "}
                          البريد
                        </span>
                        <strong>
                          {selectedQuotation.project?.email || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>
                          <MapPin
                            size={11}
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          العنوان
                        </span>
                        <strong>
                          {selectedQuotation.project?.address || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>الرقم الضريبي</span>
                        <strong>
                          {selectedQuotation.project?.tax_number || "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="qt-info-card">
                      <div className="qt-info-title">
                        <FolderKanban size={15} />
                        بيانات المشروع
                      </div>

                      <div className="qt-info-line">
                        <span>اسم المشروع</span>
                        <strong>
                          {selectedQuotation.project?.name || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>كود المشروع</span>
                        <strong dir="ltr" style={{ textAlign: "right" }}>
                          {selectedQuotation.project?.project_code || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>
                          <UserRound
                            size={11}
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          مدير المشروع
                        </span>
                        <strong>
                          {selectedQuotation.project?.project_manager || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>نوع المشروع</span>
                        <strong>
                          {selectedQuotation.project?.project_type || "—"}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>
                          <CalendarDays
                            size={11}
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          بداية متوقعة
                        </span>
                        <strong>
                          {dateText(
                            selectedQuotation.project?.expected_start_date
                          )}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>نهاية متوقعة</span>
                        <strong>
                          {dateText(
                            selectedQuotation.project?.expected_end_date
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="qt-info-card qt-total-card">
                      <div className="qt-info-title">
                        <CircleDollarSign size={15} />
                        ملخص العرض
                      </div>

                      <div className="qt-big-total">
                        {money(selectedQuotation.total)}{" "}
                        <span>ر.س</span>
                      </div>

                      <div className="qt-info-line">
                        <span>الإصدار</span>
                        <strong>V{selectedQuotation.version || 1}</strong>
                      </div>
                      <div className="qt-info-line">
                        <span>تاريخ الإنشاء</span>
                        <strong>
                          {dateTimeText(selectedQuotation.created_at)}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>صالح حتى</span>
                        <strong>
                          {dateText(selectedQuotation.valid_until)}
                        </strong>
                      </div>
                      <div className="qt-info-line">
                        <span>آخر اعتماد</span>
                        <strong>
                          {dateTimeText(selectedQuotation.approved_at)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="qt-items-card">
                    <div className="qt-items-head">تفاصيل البنود والأسعار</div>

                    <div className="qt-items-table-wrap">
                      <table className="qt-items-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>البند</th>
                            <th>SKU</th>
                            <th>الكمية</th>
                            <th>سعر الوحدة</th>
                            <th>الخصم</th>
                            <th>الضريبة</th>
                            <th>الإجمالي</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(selectedQuotation.items || []).length ? (
                            selectedQuotation.items.map((item, index) => (
                              <tr key={item.id || index}>
                                <td>{index + 1}</td>
                                <td>
                                  <strong>
                                    {item.product_name ||
                                      item.product?.name ||
                                      "—"}
                                  </strong>
                                  {item.description && (
                                    <div
                                      style={{
                                        color: "#9aa1ae",
                                        marginTop: 4,
                                        fontSize: 9,
                                      }}
                                    >
                                      {item.description}
                                    </div>
                                  )}
                                </td>
                                <td dir="ltr" style={{ textAlign: "right" }}>
                                  {item.sku || "—"}
                                </td>
                                <td>{money(item.quantity)}</td>
                                <td>{money(item.unit_price)}</td>
                                <td>{money(item.discount)}</td>
                                <td>{money(item.tax_amount)}</td>
                                <td>
                                  <strong>{money(item.line_total)}</strong>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="8">لا توجد بنود في هذا العرض.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="qt-commercial-card">
                    <div className="qt-commercial-head">
                      <div>
                        <strong>الشروط التجارية وبيانات العرض</strong>
                        <span style={{ display: "block", marginTop: 3 }}>
                          البيانات المعتمدة لهذا الإصدار من عرض السعر
                        </span>
                      </div>
                    </div>

                    <div className="qt-commercial-grid">
                      <div className="qt-commercial-item">
                        <span>رقم طلب العميل / RFQ</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.customer_rfq || "—"}
                        </strong>
                      </div>

                      <div className="qt-commercial-item">
                        <span>أعد بواسطة / Prepared By</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.prepared_by || "—"}
                        </strong>
                      </div>

                      <div className="qt-commercial-item">
                        <span>شروط الدفع</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.payment_terms ||
                            "حسب الاتفاق المعتمد مع العميل"}
                        </strong>
                      </div>

                      <div className="qt-commercial-item">
                        <span>مدة التوريد</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.delivery_period ||
                            "يتم تحديدها حسب توفر المواد وبعد اعتماد الطلب"}
                        </strong>
                      </div>

                      <div className="qt-commercial-item">
                        <span>مدة التنفيذ</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.execution_period ||
                            "يتم تحديدها حسب نطاق الأعمال والكميات وموقع المشروع"}
                        </strong>
                      </div>

                      <div className="qt-commercial-item">
                        <span>الضمان</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.warranty ||
                            "حسب شروط الضمان الخاصة بالمنتجات والأعمال المقدمة"}
                        </strong>
                      </div>

                      <div className="qt-commercial-item full">
                        <span>شروط / ملاحظات إضافية للعميل</span>
                        <strong>
                          {selectedQuotation.commercial_terms?.custom_terms ||
                            "لا توجد شروط إضافية."}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="qt-detail-bottom">
                    <div className="qt-note-card">
                      {selectedQuotation.revision_reason && (
                        <div className="qt-reason">
                          <strong>سبب التعديل / الإصدار:</strong>{" "}
                          {selectedQuotation.revision_reason}
                        </div>
                      )}

                      <div className="qt-note">
                        <strong style={{ color: "#4f5668" }}>ملاحظات:</strong>
                        <br />
                        {selectedQuotation.notes || "لا توجد ملاحظات إضافية."}
                      </div>
                    </div>

                    <div className="qt-totals-card">
                      <div className="qt-total-row">
                        <span>الإجمالي قبل الضريبة</span>
                        <strong>
                          {money(selectedQuotation.subtotal)} ر.س
                        </strong>
                      </div>
                      <div className="qt-total-row">
                        <span>الخصم</span>
                        <strong>
                          {money(selectedQuotation.discount)} ر.س
                        </strong>
                      </div>
                      <div className="qt-total-row">
                        <span>الضريبة</span>
                        <strong>{money(selectedQuotation.tax)} ر.س</strong>
                      </div>
                      <div className="qt-total-row grand">
                        <span>الإجمالي الكلي</span>
                        <strong>
                          {money(selectedQuotation.total)} ر.س
                        </strong>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
