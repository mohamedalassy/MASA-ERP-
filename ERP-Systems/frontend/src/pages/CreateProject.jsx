import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8000";
const API_URL = `${BACKEND_URL}/api`;

async function initializeCsrf() {
  const response = await fetch(`${BACKEND_URL}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("تعذر تهيئة الاتصال الآمن مع الخادم.");
}

function getXsrfToken() {
  const cookie = document.cookie.split("; ").find((row) => row.startsWith("XSRF-TOKEN="));
  return cookie ? decodeURIComponent(cookie.substring("XSRF-TOKEN=".length)) : "";
}

async function apiWrite(url, options = {}) {
  await initializeCsrf();
  const xsrfToken = getXsrfToken();
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
      ...(options.headers || {}),
    },
  });
}

const initialForm = {
  customer_id: "",
  customer_contact_id: "",

  name: "",
  project_type: "",
  priority: "normal",

  project_manager: "",
  account_manager: "",

  expected_start_date: "",
  expected_end_date: "",
  total_value: "",

  site_name: "",
  site_address: "",
  site_city: "",
  site_region: "",

  latitude: "",
  longitude: "",
  attendance_radius: "100",
};

export default function CreateProject({
  onBack,
  onCreated,
}) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loadingCustomers, setLoadingCustomers] =
    useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      setError("");

      const response = await fetch(
        `${API_URL}/customers`,
        {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "تعذر تحميل بيانات العملاء."
        );
      }

      setCustomers(result.data || []);
    } catch (err) {
      console.error(
        "CreateProject customers error:",
        err
      );

      setError(
        err.message ||
          "حدث خطأ أثناء تحميل العملاء."
      );
    } finally {
      setLoadingCustomers(false);
    }
  };

  const selectedCustomer = useMemo(() => {
    return (
      customers.find(
        (customer) =>
          String(customer.id) ===
          String(form.customer_id)
      ) || null
    );
  }, [customers, form.customer_id]);

  const contacts =
    selectedCustomer?.contacts || [];

  const selectedContact = useMemo(() => {
    return (
      contacts.find(
        (contact) =>
          String(contact.id) ===
          String(form.customer_contact_id)
      ) || null
    );
  }, [contacts, form.customer_contact_id]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleCustomerChange = (value) => {
    const customer = customers.find(
      (item) =>
        String(item.id) === String(value)
    );

    const primaryContact =
      customer?.contacts?.find(
        (contact) => contact.is_primary
      );

    setForm((current) => ({
      ...current,

      customer_id: value,

      customer_contact_id:
        primaryContact?.id
          ? String(primaryContact.id)
          : "",

      site_city:
        current.site_city ||
        customer?.city ||
        "",

      site_region:
        current.site_region ||
        customer?.region ||
        "",
    }));

    setError("");
  };

  const buildPayload = () => {
    const payload = {
      customer_id: Number(form.customer_id),

      name: form.name.trim(),

      project_type:
        form.project_type.trim() || null,

      priority:
        form.priority || "normal",

      project_manager:
        form.project_manager.trim() || null,

      account_manager:
        form.account_manager.trim() || null,

      expected_start_date:
        form.expected_start_date || null,

      expected_end_date:
        form.expected_end_date || null,

      total_value:
        form.total_value === ""
          ? 0
          : Number(form.total_value),

      site_name:
        form.site_name.trim() || null,

      site_address:
        form.site_address.trim() || null,

      site_city:
        form.site_city.trim() || null,

      site_region:
        form.site_region.trim() || null,

      latitude:
        form.latitude === ""
          ? null
          : Number(form.latitude),

      longitude:
        form.longitude === ""
          ? null
          : Number(form.longitude),

      attendance_radius:
        form.attendance_radius === ""
          ? 100
          : Number(form.attendance_radius),
    };

    if (form.customer_contact_id) {
      payload.customer_contact_id =
        Number(form.customer_contact_id);
    }

    if (selectedCustomer?.branch_id) {
      payload.branch_id =
        Number(selectedCustomer.branch_id);
    }

    return payload;
  };

  const getValidationMessage = (result) => {
    if (result?.message) {
      return result.message;
    }

    const errors = result?.errors;

    if (!errors) {
      return "تعذر إنشاء المشروع.";
    }

    const firstError = Object.values(errors)
      .flat()
      .find(Boolean);

    return (
      firstError ||
      "يرجى مراجعة بيانات المشروع."
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.customer_id) {
      setError("يجب اختيار العميل.");
      return;
    }

    if (!form.name.trim()) {
      setError("اسم المشروع مطلوب.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiWrite(
        `${API_URL}/projects`,
        {
          method: "POST",
          body: JSON.stringify(
            buildPayload()
          ),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          getValidationMessage(result)
        );
      }

      const project = result.data;

      setSuccess(
        `تم إنشاء المشروع ${project.project_code} بنجاح.`
      );

      onCreated?.(project);
    } catch (err) {
      console.error(
        "CreateProject submit error:",
        err
      );

      setError(
        err.message ||
          "حدث خطأ أثناء إنشاء المشروع."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="create-project-page"
      dir="rtl"
    >
      <div className="create-project-header">
        <div>
          <button
            type="button"
            className="create-project-back"
            onClick={onBack}
          >
            <ArrowRight size={17} />
            المشاريع
          </button>

          <span className="create-project-kicker">
            إدارة المشاريع
          </span>

          <h1>إنشاء مشروع جديد</h1>

          <p>
            ربط المشروع بملف العميل وتسجيل
            بيانات المشروع وموقع التنفيذ.
          </p>
        </div>
      </div>

      {error && (
        <div className="create-project-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="create-project-alert success">
          {success}
        </div>
      )}

      <form
        className="create-project-form"
        onSubmit={handleSubmit}
      >
        <section className="create-project-section">
          <div className="create-project-section-title">
            <Building2 size={20} />

            <div>
              <h2>بيانات العميل</h2>

              <p>
                اختر الشركة المسجلة داخل MASA ERP.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <label className="create-project-field full">
              <span>العميل *</span>

              <select
                value={form.customer_id}
                onChange={(event) =>
                  handleCustomerChange(
                    event.target.value
                  )
                }
                disabled={loadingCustomers}
              >
                <option value="">
                  {loadingCustomers
                    ? "جاري تحميل العملاء..."
                    : "اختر العميل"}
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name}
                    {customer.code
                      ? ` - ${customer.code}`
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedCustomer && (
            <div className="customer-preview">
              <div className="customer-preview-heading">
                <div>
                  <Building2 size={20} />
                </div>

                <div>
                  <strong>
                    {selectedCustomer.name}
                  </strong>

                  <span>
                    {selectedCustomer.name_en ||
                      selectedCustomer.code ||
                      "عميل MASA ERP"}
                  </span>
                </div>
              </div>

              <div className="customer-preview-grid">
                <CustomerInfo
                  label="كود العميل"
                  value={
                    selectedCustomer.code
                  }
                />

                <CustomerInfo
                  label="النشاط"
                  value={
                    selectedCustomer.industry
                  }
                />

                <CustomerInfo
                  label="السجل التجاري"
                  value={
                    selectedCustomer.commercial_register
                  }
                />

                <CustomerInfo
                  label="الرقم الضريبي"
                  value={
                    selectedCustomer.tax_number
                  }
                />

                <CustomerInfo
                  label="الهاتف"
                  value={
                    selectedCustomer.phone
                  }
                  icon={<Phone size={15} />}
                />

                <CustomerInfo
                  label="البريد الإلكتروني"
                  value={
                    selectedCustomer.email
                  }
                  icon={<Mail size={15} />}
                />

                <CustomerInfo
                  label="الموقع الإلكتروني"
                  value={
                    selectedCustomer.website
                  }
                />

                <CustomerInfo
                  label="المدينة"
                  value={
                    selectedCustomer.city
                  }
                />

                <CustomerInfo
                  label="المنطقة"
                  value={
                    selectedCustomer.region
                  }
                />

                <CustomerInfo
                  label="الدولة"
                  value={
                    selectedCustomer.country
                  }
                />

                <CustomerInfo
                  label="العنوان"
                  value={
                    selectedCustomer.address
                  }
                  wide
                />
              </div>
            </div>
          )}
        </section>

        {selectedCustomer && (
          <section className="create-project-section">
            <div className="create-project-section-title">
              <UserRound size={20} />

              <div>
                <h2>جهة اتصال المشروع</h2>

                <p>
                  الشخص المسؤول لدى العميل عن
                  المشروع.
                </p>
              </div>
            </div>

            <div className="create-project-grid">
              <label className="create-project-field full">
                <span>جهة الاتصال</span>

                <select
                  value={
                    form.customer_contact_id
                  }
                  onChange={(event) =>
                    updateField(
                      "customer_contact_id",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    بدون جهة اتصال محددة
                  </option>

                  {contacts.map((contact) => (
                    <option
                      key={contact.id}
                      value={contact.id}
                    >
                      {contact.name}
                      {contact.job_title
                        ? ` - ${contact.job_title}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedContact && (
              <div className="customer-preview-grid contact-preview">
                <CustomerInfo
                  label="الاسم"
                  value={selectedContact.name}
                />

                <CustomerInfo
                  label="المسمى الوظيفي"
                  value={
                    selectedContact.job_title
                  }
                />

                <CustomerInfo
                  label="القسم"
                  value={
                    selectedContact.department
                  }
                />

                <CustomerInfo
                  label="الهاتف"
                  value={
                    selectedContact.phone
                  }
                />

                <CustomerInfo
                  label="الجوال"
                  value={
                    selectedContact.mobile
                  }
                />

                <CustomerInfo
                  label="البريد الإلكتروني"
                  value={
                    selectedContact.email
                  }
                />
              </div>
            )}
          </section>
        )}

        <section className="create-project-section">
          <div className="create-project-section-title">
            <BriefcaseBusiness size={20} />

            <div>
              <h2>بيانات المشروع</h2>

              <p>
                المعلومات الأساسية والإدارية
                للمشروع.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <label className="create-project-field full">
              <span>اسم المشروع *</span>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                placeholder="مثال: مشروع أنظمة المراقبة - فرع الدمام"
              />
            </label>

            <label className="create-project-field">
              <span>نوع المشروع</span>

              <input
                value={form.project_type}
                onChange={(event) =>
                  updateField(
                    "project_type",
                    event.target.value
                  )
                }
                placeholder="CCTV / Network / Fire Alarm..."
              />
            </label>

            <label className="create-project-field">
              <span>الأولوية</span>

              <select
                value={form.priority}
                onChange={(event) =>
                  updateField(
                    "priority",
                    event.target.value
                  )
                }
              >
                <option value="low">
                  منخفضة
                </option>

                <option value="normal">
                  عادية
                </option>

                <option value="high">
                  عالية
                </option>

                <option value="urgent">
                  عاجلة
                </option>
              </select>
            </label>

            <label className="create-project-field">
              <span>مدير المشروع</span>

              <input
                value={form.project_manager}
                onChange={(event) =>
                  updateField(
                    "project_manager",
                    event.target.value
                  )
                }
                placeholder="اسم مدير المشروع"
              />
            </label>

            <label className="create-project-field">
              <span>Account Manager</span>

              <input
                value={form.account_manager}
                onChange={(event) =>
                  updateField(
                    "account_manager",
                    event.target.value
                  )
                }
                placeholder="مسؤول الحساب"
              />
            </label>

            <label className="create-project-field">
              <span>
                <CalendarDays size={14} />
                البداية المتوقعة
              </span>

              <input
                type="date"
                value={
                  form.expected_start_date
                }
                onChange={(event) =>
                  updateField(
                    "expected_start_date",
                    event.target.value
                  )
                }
              />
            </label>

            <label className="create-project-field">
              <span>
                <CalendarDays size={14} />
                النهاية المتوقعة
              </span>

              <input
                type="date"
                value={
                  form.expected_end_date
                }
                onChange={(event) =>
                  updateField(
                    "expected_end_date",
                    event.target.value
                  )
                }
              />
            </label>

            <label className="create-project-field">
              <span>
                <CircleDollarSign size={14} />
                قيمة المشروع المتوقعة
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.total_value}
                onChange={(event) =>
                  updateField(
                    "total_value",
                    event.target.value
                  )
                }
                placeholder="0.00"
              />
            </label>
          </div>
        </section>

        <section className="create-project-section">
          <div className="create-project-section-title">
            <MapPin size={20} />

            <div>
              <h2>موقع المشروع</h2>

              <p>
                الموقع سيستخدم لاحقًا في إدارة
                التنفيذ وبصمة الموظفين بالموقع.
              </p>
            </div>
          </div>

          <div className="create-project-grid">
            <label className="create-project-field">
              <span>اسم الموقع</span>

              <input
                value={form.site_name}
                onChange={(event) =>
                  updateField(
                    "site_name",
                    event.target.value
                  )
                }
                placeholder="مثال: مستودع الدمام"
              />
            </label>

            <label className="create-project-field">
              <span>المدينة</span>

              <input
                value={form.site_city}
                onChange={(event) =>
                  updateField(
                    "site_city",
                    event.target.value
                  )
                }
                placeholder="الدمام"
              />
            </label>

            <label className="create-project-field">
              <span>المنطقة</span>

              <input
                value={form.site_region}
                onChange={(event) =>
                  updateField(
                    "site_region",
                    event.target.value
                  )
                }
                placeholder="المنطقة الشرقية"
              />
            </label>

            <label className="create-project-field full">
              <span>عنوان موقع المشروع</span>

              <textarea
                rows={3}
                value={form.site_address}
                onChange={(event) =>
                  updateField(
                    "site_address",
                    event.target.value
                  )
                }
                placeholder="العنوان التفصيلي للموقع"
              />
            </label>

            <label className="create-project-field">
              <span>Latitude</span>

              <input
                type="number"
                step="0.0000001"
                value={form.latitude}
                onChange={(event) =>
                  updateField(
                    "latitude",
                    event.target.value
                  )
                }
                placeholder="26.4207000"
              />
            </label>

            <label className="create-project-field">
              <span>Longitude</span>

              <input
                type="number"
                step="0.0000001"
                value={form.longitude}
                onChange={(event) =>
                  updateField(
                    "longitude",
                    event.target.value
                  )
                }
                placeholder="50.0888000"
              />
            </label>

            <label className="create-project-field">
              <span>
                نطاق البصمة بالمتر
              </span>

              <input
                type="number"
                min="10"
                max="10000"
                value={
                  form.attendance_radius
                }
                onChange={(event) =>
                  updateField(
                    "attendance_radius",
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        </section>

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
              loadingCustomers
            }
          >
            {saving ? (
              <>
                <Loader2
                  size={17}
                  className="spin"
                />
                جاري إنشاء المشروع...
              </>
            ) : (
              <>
                <Save size={17} />
                إنشاء المشروع
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function CustomerInfo({
  label,
  value,
  icon = null,
  wide = false,
}) {
  return (
    <div
      className={`customer-preview-item ${
        wide ? "wide" : ""
      }`}
    >
      <span>{label}</span>

      <strong>
        {icon}
        {value || "-"}
      </strong>
    </div>
  );
}