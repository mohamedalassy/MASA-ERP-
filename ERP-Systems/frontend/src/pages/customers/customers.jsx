import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Plus,
  RefreshCcw,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Users,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

export default function Customers({
  onNavigate,
}) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/customers`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "تعذر تحميل العملاء."
        );
      }

      setCustomers(result.data || []);
    } catch (err) {
      console.error(
        "Customers load error:",
        err
      );

      setError(
        err.message ||
          "حدث خطأ أثناء تحميل العملاء."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name
          ?.toLowerCase()
          .includes(value) ||
        customer.name_en
          ?.toLowerCase()
          .includes(value) ||
        customer.code
          ?.toLowerCase()
          .includes(value) ||
        customer.phone
          ?.toLowerCase()
          .includes(value) ||
        customer.email
          ?.toLowerCase()
          .includes(value) ||
        customer.commercial_register
          ?.toLowerCase()
          .includes(value) ||
        customer.tax_number
          ?.toLowerCase()
          .includes(value)
    );
  }, [customers, search]);

  return (
    <div
      className="customers-page"
      dir="rtl"
    >
      <div className="customers-header">
        <div>
          <span className="customers-kicker">
            CRM
          </span>

          <h1>العملاء</h1>

          <p>
            إدارة الشركات والعملاء وبيانات
            التواصل والمشاريع المرتبطة بهم.
          </p>
        </div>

        <div className="customers-header-actions">
          <button
            type="button"
            className="customers-create-btn"
            onClick={() =>
              onNavigate?.(
                "customer-create"
              )
            }
          >
            <Plus size={18} />
            عميل جديد
          </button>

          <div className="customers-count-card">
            <Users size={20} />

            <div>
              <strong>
                {customers.length}
              </strong>

              <span>عميل</span>
            </div>
          </div>
        </div>
      </div>

      <div className="customers-toolbar">
        <div className="customers-search">
          <Search size={18} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="ابحث بالاسم أو الكود أو السجل التجاري أو الرقم الضريبي..."
          />
        </div>

        <button
          type="button"
          className="customers-refresh"
          onClick={loadCustomers}
          disabled={loading}
        >
          <RefreshCcw
            size={17}
            className={
              loading ? "spin" : ""
            }
          />

          تحديث
        </button>
      </div>

      {loading && (
        <div className="customers-state">
          جاري تحميل العملاء...
        </div>
      )}

      {!loading && error && (
        <div className="customers-state error">
          <strong>
            تعذر تحميل العملاء
          </strong>

          <span>{error}</span>
        </div>
      )}

      {!loading &&
        !error &&
        filteredCustomers.length ===
          0 && (
          <div className="customers-empty">
            <Building2 size={40} />

            <strong>
              لا يوجد عملاء
            </strong>

            <span>
              {search
                ? "لا توجد نتائج مطابقة للبحث."
                : "ابدأ بإضافة أول عميل إلى MASA ERP."}
            </span>

            {!search && (
              <button
                type="button"
                className="customers-create-btn"
                onClick={() =>
                  onNavigate?.(
                    "customer-create"
                  )
                }
              >
                <Plus size={17} />
                إضافة أول عميل
              </button>
            )}
          </div>
        )}

      {!loading &&
        !error &&
        filteredCustomers.length >
          0 && (
          <div className="customers-grid">
            {filteredCustomers.map(
              (customer) => (
                <div
                  className="customer-card"
                  key={customer.id}
                >
                  <div className="customer-card-head">
                    <div className="customer-card-icon">
                      <Building2
                        size={20}
                      />
                    </div>

                    <div>
                      <strong>
                        {customer.name}
                      </strong>

                      <span>
                        {customer.name_en ||
                          customer.code ||
                          "MASA Customer"}
                      </span>
                    </div>
                  </div>

                  <div className="customer-card-data">
                    <CustomerRow
                      icon={
                        <Phone
                          size={14}
                        />
                      }
                      value={
                        customer.phone
                      }
                    />

                    <CustomerRow
                      icon={
                        <Mail
                          size={14}
                        />
                      }
                      value={
                        customer.email
                      }
                    />

                    <CustomerRow
                      icon={
                        <MapPin
                          size={14}
                        />
                      }
                      value={[
                        customer.city,
                        customer.region,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    />
                  </div>

                  <div className="customer-card-meta">
                    <span>
                      {customer.type ||
                        "company"}
                    </span>

                    <span>
                      {customer.status ||
                        "active"}
                    </span>

                    {customer.projects_count !==
                      undefined && (
                      <span>
                        {
                          customer.projects_count
                        }{" "}
                        مشروع
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="customer-open-btn"
                    onClick={() =>
                      onNavigate?.(
                        "customer-360",
                        {
                          customerId:
                            customer.id,
                        }
                      )
                    }
                  >
                    فتح ملف العميل

                    <ArrowLeft
                      size={15}
                    />
                  </button>
                </div>
              )
            )}
          </div>
        )}
    </div>
  );
}

function CustomerRow({
  icon,
  value,
}) {
  return (
    <div className="customer-card-row">
      {icon}

      <span>{value || "-"}</span>
    </div>
  );
}