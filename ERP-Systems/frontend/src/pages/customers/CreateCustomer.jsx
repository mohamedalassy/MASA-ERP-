import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Save,
  Loader2,
  MapPin,
  UserRound,
  RefreshCw,
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8000";
const API_URL = `${BACKEND_URL}/api`;

const initialForm = {
  branch_id: "",
  code: "",
  name: "",
  name_en: "",
  type: "company",
  industry: "",
  phone: "",
  email: "",
  website: "",
  commercial_register: "",
  tax_number: "",
  credit_limit: "",
  payment_terms_days: "30",
  address: "",
  city: "",
  region: "",
  country: "Saudi Arabia",
  status: "active",
  notes: "",

  contact_name: "",
  contact_job_title: "",
  contact_department: "",
  contact_phone: "",
  contact_mobile: "",
  contact_email: "",
};

/* =========================================================
   CSRF / Sanctum
========================================================= */

async function initializeCsrf() {
  const response = await fetch(
    `${BACKEND_URL}/sanctum/csrf-cookie`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      "تعذر تهيئة الاتصال الآمن مع الخادم."
    );
  }
}

function getXsrfToken() {
  const cookie = document.cookie
    .split("; ")
    .find((row) =>
      row.startsWith("XSRF-TOKEN=")
    );

  if (!cookie) {
    return "";
  }

  return decodeURIComponent(
    cookie.substring(
      "XSRF-TOKEN=".length
    )
  );
}

async function apiWrite(
  url,
  options = {}
) {
  await initializeCsrf();

  const token = getXsrfToken();

  const response = await fetch(
    url,
    {
      ...options,

      credentials: "include",

      headers: {
        Accept: "application/json",

        "Content-Type":
          "application/json",

        ...(token
          ? {
              "X-XSRF-TOKEN":
                token,
            }
          : {}),

        ...(options.headers || {}),
      },
    }
  );

  return response;
}

/* =========================================================
   Component
========================================================= */

export default function CreateCustomer({
  onBack,
  onCreated,
}) {
  const [form, setForm] =
    useState(initialForm);

  const [branches, setBranches] =
    useState([]);

  const [
    branchesLoading,
    setBranchesLoading,
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     Load Branches
  ======================================================= */

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setBranchesLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/branches?is_active=true`,
        {
          method: "GET",

          credentials: "include",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        result?.success === false
      ) {
        throw new Error(
          result?.message ||
            "تعذر تحميل الفروع."
        );
      }

      const rows =
        Array.isArray(result?.data)
          ? result.data
          : [];

      setBranches(rows);

      /*
       * لو عندنا فرع واحد فقط
       * يتم اختياره تلقائياً.
       */

      if (rows.length === 1) {
        setForm((current) => ({
          ...current,

          branch_id: String(
            rows[0].id
          ),
        }));
      }
    } catch (err) {
      console.error(
        "Load branches error:",
        err
      );

      setError(
        err?.message ||
          "تعذر تحميل الفروع."
      );
    } finally {
      setBranchesLoading(false);
    }
  };

  /* =======================================================
     Form
  ======================================================= */

  const updateField = (
    field,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const getErrorMessage = (
    result
  ) => {
    const firstValidationError =
      Object.values(
        result?.errors || {}
      )
        .flat()
        .find(Boolean);

    return (
      firstValidationError ||
      result?.message ||
      "تعذر حفظ العميل."
    );
  };

  /* =======================================================
     Create Contact
  ======================================================= */

  const createContact =
    async (customerId) => {
      if (
        !form.contact_name.trim()
      ) {
        return;
      }

      const payload = {
        name:
          form.contact_name.trim(),

        job_title:
          form.contact_job_title.trim() ||
          null,

        department:
          form.contact_department.trim() ||
          null,

        phone:
          form.contact_phone.trim() ||
          null,

        mobile:
          form.contact_mobile.trim() ||
          null,

        email:
          form.contact_email.trim() ||
          null,

        role: "project_contact",

        influence_level: "high",

        is_primary: true,

        is_decision_maker: false,
      };

      const response =
        await apiWrite(
          `${API_URL}/customers/${customerId}/contacts`,
          {
            method: "POST",

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          getErrorMessage(result)
        );
      }

      return result.data;
    };

  /* =======================================================
     Submit
  ======================================================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (!form.name.trim()) {
        setError(
          "اسم العميل مطلوب."
        );

        return;
      }

      if (!form.branch_id) {
        setError(
          "يجب اختيار فرع العميل."
        );

        return;
      }

      try {
        setSaving(true);
        setError("");

        const payload = {
          branch_id:
            Number(
              form.branch_id
            ),

          code:
            form.code.trim() ||
            null,

          name:
            form.name.trim(),

          name_en:
            form.name_en.trim() ||
            null,

          type:
            form.type,

          industry:
            form.industry.trim() ||
            null,

          phone:
            form.phone.trim() ||
            null,

          email:
            form.email.trim() ||
            null,

          website:
            form.website.trim() ||
            null,

          commercial_register:
            form.commercial_register.trim() ||
            null,

          tax_number:
            form.tax_number.trim() ||
            null,

          credit_limit:
            form.credit_limit === ""
              ? 0
              : Number(
                  form.credit_limit
                ),

          payment_terms_days:
            form.payment_terms_days ===
            ""
              ? 0
              : Number(
                  form.payment_terms_days
                ),

          address:
            form.address.trim() ||
            null,

          city:
            form.city.trim() ||
            null,

          region:
            form.region.trim() ||
            null,

          country:
            form.country.trim() ||
            null,

          status:
            form.status,

          notes:
            form.notes.trim() ||
            null,
        };

        /*
         * Create Customer
         */

        const response =
          await apiWrite(
            `${API_URL}/customers`,
            {
              method: "POST",

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result?.success
        ) {
          throw new Error(
            getErrorMessage(result)
          );
        }

        const customer =
          result.data;

        /*
         * Create Primary Contact
         */

        await createContact(
          customer.id
        );

        /*
         * Open Customer 360
         */

        onCreated?.(customer);
      } catch (err) {
        console.error(
          "CreateCustomer error:",
          err
        );

        setError(
          err?.message ||
            "حدث خطأ أثناء حفظ العميل."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     Render
  ======================================================= */

  return (
    <div
      className="create-customer-page"
      dir="rtl"
    >
      {/* Header */}

      <div className="create-customer-header">
        <button
          type="button"
          className="create-customer-back"
          onClick={onBack}
        >
          <ArrowRight size={17} />

          العملاء
        </button>

        <span className="customers-kicker">
          CRM
        </span>

        <h1>
          إضافة عميل جديد
        </h1>

        <p>
          إنشاء ملف شركة متكامل يمكن
          استخدامه في المبيعات والمشاريع
          وعروض الأسعار والفواتير.
        </p>
      </div>

      {/* Error */}

      {error && (
        <div className="create-project-alert error">
          {error}
        </div>
      )}

      <form
        className="create-project-form"
        onSubmit={handleSubmit}
      >
        {/* ===============================================
            Company
        =============================================== */}

        <section className="create-project-section">
          <div className="create-project-section-title">
            <Building2 size={20} />

            <div>
              <h2>
                بيانات الشركة
              </h2>

              <p>
                البيانات القانونية
                والأساسية للعميل.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <Field
              label="اسم الشركة *"
              value={form.name}
              onChange={(value) =>
                updateField(
                  "name",
                  value
                )
              }
            />

            <Field
              label="اسم الشركة بالإنجليزية"
              value={form.name_en}
              onChange={(value) =>
                updateField(
                  "name_en",
                  value
                )
              }
            />

            <Field
              label="كود العميل"
              value={form.code}
              placeholder="يُنشأ تلقائياً عند تركه فارغاً"
              onChange={(value) =>
                updateField(
                  "code",
                  value
                )
              }
            />

            <label className="create-project-field">
              <span>
                نوع العميل
              </span>

              <select
                value={form.type}
                onChange={(event) =>
                  updateField(
                    "type",
                    event.target.value
                  )
                }
              >
                <option value="company">
                  شركة
                </option>

                <option value="individual">
                  فرد
                </option>

                <option value="government">
                  جهة حكومية
                </option>
              </select>
            </label>

            <Field
              label="النشاط / القطاع"
              value={form.industry}
              onChange={(value) =>
                updateField(
                  "industry",
                  value
                )
              }
            />

            {/* Branch */}

            <label className="create-project-field">
              <span>
                الفرع *
              </span>

              <select
                value={form.branch_id}
                disabled={
                  branchesLoading ||
                  saving
                }
                onChange={(event) =>
                  updateField(
                    "branch_id",
                    event.target.value
                  )
                }
              >
                <option value="">
                  {branchesLoading
                    ? "جاري تحميل الفروع..."
                    : branches.length
                    ? "اختر الفرع"
                    : "لا توجد فروع"}
                </option>

                {branches.map(
                  (branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}

                      {branch.code
                        ? ` — ${branch.code}`
                        : ""}

                      {branch.is_head_office
                        ? " — الفرع الرئيسي"
                        : ""}
                    </option>
                  )
                )}
              </select>
            </label>

            <Field
              label="السجل التجاري"
              value={
                form.commercial_register
              }
              onChange={(value) =>
                updateField(
                  "commercial_register",
                  value
                )
              }
            />

            <Field
              label="الرقم الضريبي"
              value={
                form.tax_number
              }
              onChange={(value) =>
                updateField(
                  "tax_number",
                  value
                )
              }
            />
          </div>

          {!branchesLoading &&
            branches.length === 0 && (
              <div
                className="create-project-alert error"
                style={{
                  marginTop: 16,
                }}
              >
                لا توجد فروع متاحة في
                النظام. يجب إنشاء فرع
                أولاً قبل إضافة العميل.

                <button
                  type="button"
                  onClick={loadBranches}
                  style={{
                    marginRight: 12,
                    border: 0,
                    background:
                      "transparent",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  <RefreshCw
                    size={14}
                    style={{
                      marginLeft: 5,
                    }}
                  />

                  تحديث
                </button>
              </div>
            )}
        </section>

        {/* ===============================================
            Communication
        =============================================== */}

        <section className="create-project-section">
          <div className="create-project-section-title">
            <UserRound size={20} />

            <div>
              <h2>
                بيانات التواصل
              </h2>

              <p>
                وسائل التواصل الرسمية
                مع العميل.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <Field
              label="الهاتف"
              value={form.phone}
              onChange={(value) =>
                updateField(
                  "phone",
                  value
                )
              }
            />

            <Field
              label="البريد الإلكتروني"
              type="email"
              value={form.email}
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
            />

            <Field
              label="الموقع الإلكتروني"
              value={form.website}
              placeholder="https://"
              onChange={(value) =>
                updateField(
                  "website",
                  value
                )
              }
            />
          </div>
        </section>

        {/* ===============================================
            Address
        =============================================== */}

        <section className="create-project-section">
          <div className="create-project-section-title">
            <MapPin size={20} />

            <div>
              <h2>
                العنوان
              </h2>

              <p>
                عنوان الشركة الرئيسي.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <Field
              label="المدينة"
              value={form.city}
              onChange={(value) =>
                updateField(
                  "city",
                  value
                )
              }
            />

            <Field
              label="المنطقة"
              value={form.region}
              onChange={(value) =>
                updateField(
                  "region",
                  value
                )
              }
            />

            <Field
              label="الدولة"
              value={form.country}
              onChange={(value) =>
                updateField(
                  "country",
                  value
                )
              }
            />

            <label className="create-project-field full">
              <span>
                العنوان التفصيلي
              </span>

              <textarea
                rows={3}
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* ===============================================
            Commercial
        =============================================== */}

        <section className="create-project-section">
          <div className="create-project-section-title">
            <Building2 size={20} />

            <div>
              <h2>
                البيانات التجارية
              </h2>

              <p>
                شروط التعامل المالي
                والائتماني.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <Field
              label="الحد الائتماني"
              type="number"
              value={
                form.credit_limit
              }
              onChange={(value) =>
                updateField(
                  "credit_limit",
                  value
                )
              }
            />

            <Field
              label="مدة السداد بالأيام"
              type="number"
              value={
                form.payment_terms_days
              }
              onChange={(value) =>
                updateField(
                  "payment_terms_days",
                  value
                )
              }
            />

            <label className="create-project-field">
              <span>
                الحالة
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
                  )
                }
              >
                <option value="active">
                  نشط
                </option>

                <option value="inactive">
                  غير نشط
                </option>

                <option value="blocked">
                  محظور
                </option>
              </select>
            </label>

            <label className="create-project-field full">
              <span>
                ملاحظات
              </span>

              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

        {/* ===============================================
            Primary Contact
        =============================================== */}

        <section className="create-project-section">
          <div className="create-project-section-title">
            <UserRound size={20} />

            <div>
              <h2>
                جهة الاتصال الرئيسية
              </h2>

              <p>
                يمكن إضافة أول مسؤول
                لدى العميل أثناء إنشاء
                الشركة.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <Field
              label="اسم المسؤول"
              value={
                form.contact_name
              }
              onChange={(value) =>
                updateField(
                  "contact_name",
                  value
                )
              }
            />

            <Field
              label="المسمى الوظيفي"
              value={
                form.contact_job_title
              }
              onChange={(value) =>
                updateField(
                  "contact_job_title",
                  value
                )
              }
            />

            <Field
              label="القسم"
              value={
                form.contact_department
              }
              onChange={(value) =>
                updateField(
                  "contact_department",
                  value
                )
              }
            />

            <Field
              label="الهاتف"
              value={
                form.contact_phone
              }
              onChange={(value) =>
                updateField(
                  "contact_phone",
                  value
                )
              }
            />

            <Field
              label="الجوال"
              value={
                form.contact_mobile
              }
              onChange={(value) =>
                updateField(
                  "contact_mobile",
                  value
                )
              }
            />

            <Field
              label="البريد الإلكتروني"
              type="email"
              value={
                form.contact_email
              }
              onChange={(value) =>
                updateField(
                  "contact_email",
                  value
                )
              }
            />
          </div>
        </section>

        {/* ===============================================
            Actions
        =============================================== */}

        <div className="create-project-actions">
          <button
            type="button"
            className="create-project-cancel"
            onClick={onBack}
            disabled={saving}
          >
            إلغاء
          </button>

          <button
            type="submit"
            className="create-project-save"
            disabled={
              saving ||
              branchesLoading ||
              branches.length === 0
            }
          >
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="spin"
                />

                جاري الحفظ...
              </>
            ) : (
              <>
                <Save size={17} />

                حفظ العميل
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   Reusable Field
========================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) {
  return (
    <label className="create-project-field">
      <span>
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </label>
  );
}