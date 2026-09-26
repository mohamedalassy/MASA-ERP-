import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  UserRound,
  Phone,
  Mail,
  MapPin,
  Globe2,
  BadgeCheck,
  FolderKanban,
  Plus,
  BriefcaseBusiness,
  Hash,
  ReceiptText,
  Loader2,
  AlertCircle,
  WalletCards,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8000/api";

export default function Customer360({
  customerId,
  onBack,
  onNavigate,
}) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setLoading(false);
      setError("لم يتم تحديد العميل.");
      return;
    }

    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE}/customers/${customerId}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "تعذر تحميل بيانات العميل."
        );
      }

      setCustomer(
        result?.data || result || null
      );
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "حدث خطأ أثناء تحميل بيانات العميل."
      );
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryContact = () => {
    if (!customer?.contacts?.length) {
      return null;
    }

    return (
      customer.contacts.find(
        (contact) => contact.is_primary
      ) || customer.contacts[0]
    );
  };

  const primaryContact =
    getPrimaryContact();

  const displayValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    return value;
  };

  if (loading) {
    return (
      <section
        className="create-project-page"
        dir="rtl"
      >
        <div
          className="create-project-form"
          style={{
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Loader2
            size={24}
            className="spin"
          />

          <span>
            جاري تحميل بيانات العميل...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section
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
              <ArrowRight size={18} />
              العودة للعملاء
            </button>

            <h1>ملف العميل</h1>
          </div>
        </div>

        <div className="create-project-alert error">
          <AlertCircle size={18} />
          {error}
        </div>
      </section>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <section
      className="create-project-page"
      dir="rtl"
    >
      {/* Header */}

      <div className="create-project-header">
        <div>
          <button
            type="button"
            className="create-project-back"
            onClick={onBack}
          >
            <ArrowRight size={18} />

            العودة للعملاء
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div
              className="create-project-section-icon"
              style={{
                width: 48,
                height: 48,
              }}
            >
              <Building2 size={22} />
            </div>

            <div>
              <h1
                style={{
                  marginBottom: 4,
                }}
              >
                {customer.name}
              </h1>

              <p
                style={{
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                {customer.name_en ||
                  customer.code ||
                  "Customer 360"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="create-project-save"
          onClick={() =>
            onNavigate?.(
              "project-create",
              {
                customerId: customer.id,
              }
            )
          }
        >
          <Plus size={18} />

          مشروع جديد
        </button>
      </div>

      {/* Customer summary */}

      <div className="create-project-form">
        <div className="create-project-section-title">
          <div className="create-project-section-icon">
            <Building2 size={19} />
          </div>

          <div>
            <h2>
              بيانات الشركة
            </h2>

            <p>
              البيانات الأساسية والقانونية
              للعميل
            </p>
          </div>
        </div>

        <div className="customer-preview-grid">
          <InfoItem
            icon={Hash}
            label="كود العميل"
            value={displayValue(
              customer.code
            )}
          />

          <InfoItem
            icon={BriefcaseBusiness}
            label="نوع العميل"
            value={displayValue(
              customer.type
            )}
          />

          <InfoItem
            icon={Building2}
            label="القطاع"
            value={displayValue(
              customer.industry
            )}
          />

          <InfoItem
            icon={BadgeCheck}
            label="الحالة"
            value={displayValue(
              customer.status
            )}
          />

          <InfoItem
            icon={ReceiptText}
            label="السجل التجاري"
            value={displayValue(
              customer.commercial_register
            )}
          />

          <InfoItem
            icon={ReceiptText}
            label="الرقم الضريبي"
            value={displayValue(
              customer.tax_number
            )}
          />

          <InfoItem
            icon={Phone}
            label="الهاتف"
            value={displayValue(
              customer.phone
            )}
          />

          <InfoItem
            icon={Mail}
            label="البريد الإلكتروني"
            value={displayValue(
              customer.email
            )}
          />

          <InfoItem
            icon={Globe2}
            label="الموقع الإلكتروني"
            value={displayValue(
              customer.website
            )}
          />

          <InfoItem
            icon={MapPin}
            label="المدينة"
            value={displayValue(
              customer.city
            )}
          />

          <InfoItem
            icon={MapPin}
            label="المنطقة"
            value={displayValue(
              customer.region
            )}
          />

          <InfoItem
            icon={MapPin}
            label="الدولة"
            value={displayValue(
              customer.country
            )}
          />
        </div>

        {customer.address && (
          <div
            className="customer-contact-preview"
            style={{
              marginTop: 16,
            }}
          >
            <MapPin size={19} />

            <div>
              <strong>
                العنوان
              </strong>

              <span>
                {customer.address}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Primary Contact */}

      <div className="create-project-form">
        <div className="create-project-section-title">
          <div className="create-project-section-icon">
            <UserRound size={19} />
          </div>

          <div>
            <h2>
              جهة الاتصال الرئيسية
            </h2>

            <p>
              المسؤول الرئيسي لدى العميل
            </p>
          </div>
        </div>

        {primaryContact ? (
          <div className="customer-preview-grid">
            <InfoItem
              icon={UserRound}
              label="الاسم"
              value={displayValue(
                primaryContact.name
              )}
            />

            <InfoItem
              icon={BriefcaseBusiness}
              label="المسمى الوظيفي"
              value={displayValue(
                primaryContact.job_title
              )}
            />

            <InfoItem
              icon={Building2}
              label="القسم"
              value={displayValue(
                primaryContact.department
              )}
            />

            <InfoItem
              icon={Phone}
              label="الجوال"
              value={displayValue(
                primaryContact.mobile ||
                  primaryContact.phone
              )}
            />

            <InfoItem
              icon={Mail}
              label="البريد الإلكتروني"
              value={displayValue(
                primaryContact.email
              )}
            />
          </div>
        ) : (
          <div className="customer-contact-preview">
            <UserRound size={19} />

            <div>
              <strong>
                لا توجد جهة اتصال
              </strong>

              <span>
                لم يتم إضافة جهة اتصال
                لهذا العميل بعد.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Projects */}

      <div className="create-project-form">
        <div className="create-project-section-title">
          <div className="create-project-section-icon">
            <FolderKanban size={19} />
          </div>

          <div>
            <h2>
              المشاريع
            </h2>

            <p>
              المشاريع المرتبطة بهذا العميل
            </p>
          </div>
        </div>

        <div className="customer-preview-grid">
          <InfoItem
            icon={FolderKanban}
            label="إجمالي المشاريع"
            value={
              customer.projects_count ??
              customer.projects?.length ??
              0
            }
          />

          <InfoItem
            icon={WalletCards}
            label="حد الائتمان"
            value={
              customer.credit_limit
                ? `${Number(
                    customer.credit_limit
                  ).toLocaleString()} ر.س`
                : "—"
            }
          />

          <InfoItem
            icon={ReceiptText}
            label="مدة السداد"
            value={
              customer.payment_terms_days
                ? `${customer.payment_terms_days} يوم`
                : "—"
            }
          />
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="create-project-save"
            onClick={() =>
              onNavigate?.(
                "project-create",
                {
                  customerId:
                    customer.id,
                }
              )
            }
          >
            <Plus size={18} />

            إنشاء مشروع للعميل
          </button>
        </div>
      </div>
    </section>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="customer-preview-item">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 5,
        }}
      >
        {Icon && (
          <Icon
            size={15}
            strokeWidth={1.8}
          />
        )}

        <span>{label}</span>
      </div>

      <strong>{value}</strong>
    </div>
  );
}