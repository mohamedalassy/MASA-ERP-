import { useEffect, useMemo, useState } from "react";

import {
  ShoppingCart,
  Building2,
  CalendarDays,
  ArrowLeft,
  RefreshCcw,
  Search,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const formatMoney = (value) => {
  return `${Number(value || 0).toLocaleString("en-US")} ر.س`;
};

const formatDate = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-CA");
};

const statusNames = {
  draft: "مسودة",
  pending: "قيد المراجعة",
  approved: "معتمد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export default function PurchaseOrders({
  projectId = 1,
  onBack,
  onOpenPurchaseOrder,
}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/purchase-orders`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "تعذر تحميل أوامر الشراء"
        );
      }

      setOrders(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "حدث خطأ أثناء تحميل أوامر الشراء"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [projectId]);

  const filteredOrders = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return orders;
    }

    return orders.filter((order) => {
      const poNumber = String(
        order.po_number || ""
      ).toLowerCase();

      const supplier = String(
        order.supplier?.name || ""
      ).toLowerCase();

      return (
        poNumber.includes(value) ||
        supplier.includes(value)
      );
    });
  }, [orders, search]);

  return (
    <div
      className="purchase-orders-page"
      dir="rtl"
    >
      <div className="purchase-orders-header">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="purchase-orders-back"
            >
              الرجوع للمشروع
            </button>
          )}

          <span className="purchase-orders-kicker">
            المشتريات
          </span>

          <h1>
            أوامر شراء المشروع
          </h1>

          <p>
            إدارة ومتابعة أوامر الشراء
            الخاصة بالمشروع.
          </p>
        </div>

        <div className="purchase-orders-count">
          <ShoppingCart size={20} />

          <div>
            <strong>
              {orders.length}
            </strong>

            <span>
              أمر شراء
            </span>
          </div>
        </div>
      </div>

      <div className="purchase-orders-toolbar">
        <div className="purchase-orders-search">
          <Search size={17} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="ابحث برقم أمر الشراء أو المورد..."
          />
        </div>

        <button
          type="button"
          className="purchase-orders-refresh"
          onClick={loadOrders}
        >
          <RefreshCcw size={16} />
          تحديث
        </button>
      </div>

      {loading && (
        <div className="purchase-orders-state">
          جاري تحميل أوامر الشراء...
        </div>
      )}

      {!loading && error && (
        <div className="purchase-orders-state error">
          <strong>
            تعذر تحميل أوامر الشراء
          </strong>

          <span>{error}</span>
        </div>
      )}

      {!loading &&
        !error &&
        filteredOrders.length === 0 && (
          <div className="purchase-orders-empty">
            <ShoppingCart size={40} />

            <strong>
              لا توجد أوامر شراء
            </strong>

            <span>
              لا توجد أوامر شراء
              مطابقة حاليًا.
            </span>
          </div>
        )}

      {!loading &&
        !error &&
        filteredOrders.length > 0 && (
          <div className="purchase-orders-table">
            <div className="purchase-orders-head">
              <span>
                رقم أمر الشراء
              </span>

              <span>
                المورد
              </span>

              <span>
                تاريخ الطلب
              </span>

              <span>
                التوريد المتوقع
              </span>

              <span>
                الحالة
              </span>

              <span>
                الإجمالي
              </span>

              <span></span>
            </div>

            {filteredOrders.map(
              (order) => (
                <div
                  className="purchase-orders-row"
                  key={order.id}
                >
                  <div>
                    <strong className="po-code">
                      {order.po_number}
                    </strong>
                  </div>

                  <div className="po-supplier">
                    <Building2 size={15} />

                    <span>
                      {order.supplier?.name ||
                        "غير محدد"}
                    </span>
                  </div>

                  <div className="po-date">
                    <CalendarDays size={14} />

                    <span>
                      {formatDate(
                        order.order_date
                      )}
                    </span>
                  </div>

                  <div>
                    {formatDate(
                      order.expected_delivery_date
                    )}
                  </div>

                  <div>
                    <span className="po-status">
                      {statusNames[
                        order.status
                      ] ||
                        order.status}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {formatMoney(
                        order.total
                      )}
                    </strong>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="po-open-button"
                      onClick={() =>
                        onOpenPurchaseOrder?.(
                          order.id
                        )
                      }
                    >
                      فتح

                      <ArrowLeft
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
    </div>
  );
}