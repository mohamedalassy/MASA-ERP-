import { useEffect, useMemo, useState } from "react";

import {
  Boxes,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCcw,
  Search,
  AlertTriangle,
  History,
  Send,
  X,
  Plus,
  Save,
  Pencil,
  Power,
} from "lucide-react";

import { erpRequest } from "../api/erpApi";


const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ر.س`;

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("ar-SA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [projects, setProjects] = useState([]);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueError, setIssueError] = useState("");
  const [issueSuccess, setIssueSuccess] = useState("");

  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [savingProductEdit, setSavingProductEdit] = useState(false);
  const [productActionId, setProductActionId] = useState(null);
  const [editProductError, setEditProductError] = useState("");

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    brand: "",
    model: "",
    unit: "قطعة",
    description: "",
    cost_price: "",
    default_sale_price: "",
    tax_rate: "15",
    opening_stock: "",
    minimum_stock: "",
    default_supplier: "",
    is_active: true,
  });

  const [issueForm, setIssueForm] = useState({
    project_id: "",
    product_id: "",
    quantity: "",
    reference: "",
    notes: "",
  });

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError("");

      const [productsResult, transactionsResult] =
        await Promise.all([
          erpRequest("/products"),
          erpRequest("/inventory-transactions"),
        ]);

      if (productsResult?.success === false) {
        throw new Error(
          productsResult.message ||
            "تعذر تحميل بيانات المنتجات."
        );
      }

      if (transactionsResult?.success === false) {
        throw new Error(
          transactionsResult.message ||
            "تعذر تحميل حركات المخزون."
        );
      }

      setProducts(
        Array.isArray(productsResult?.data)
          ? productsResult.data
          : []
      );

      setTransactions(
        Array.isArray(transactionsResult?.data)
          ? transactionsResult.data
          : []
      );

      try {
        const projectsResult = await erpRequest("/projects");

        setProjects(
          Array.isArray(projectsResult?.data)
            ? projectsResult.data
            : Array.isArray(projectsResult)
            ? projectsResult
            : []
        );
      } catch (projectsError) {
        console.error(projectsError);
      }
    } catch (error) {
      console.error(error);

      setError(
        error.message ||
          "حدث خطأ أثناء تحميل المخزون."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) => {
      return [
        product.name,
        product.sku,
        product.brand,
        product.model,
        product.category,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(term)
        );
    });
  }, [products, search]);

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock_quantity || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock_quantity || 0) <=
      Number(product.minimum_stock || 0)
  );

  const totalStockValue = products.reduce(
    (sum, product) =>
      sum +
      Number(product.stock_quantity || 0) *
        Number(product.cost_price || 0),
    0
  );

  const selectedIssueProduct = products.find(
    (product) =>
      String(product.id) ===
      String(issueForm.product_id)
  );

  const selectedIssueStock = Number(
    selectedIssueProduct?.stock_quantity || 0
  );

  const openAddProductForm = () => {
    setProductError("");
    setProductSuccess("");
    setProductForm({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      brand: "",
      model: "",
      unit: "قطعة",
      description: "",
      cost_price: "",
      default_sale_price: "",
      tax_rate: "15",
      opening_stock: "",
      minimum_stock: "",
      default_supplier: "",
      is_active: true,
    });
    setShowAddProductForm(true);
  };

  const closeAddProductForm = () => {
    if (creatingProduct) return;
    setShowAddProductForm(false);
    setProductError("");
  };

  const handleProductChange = (field, value) => {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAddProductSubmit = async (event) => {
    event.preventDefault();

    if (!productForm.name.trim()) {
      setProductError("أدخل اسم المنتج.");
      return;
    }

    if (!productForm.sku.trim()) {
      setProductError("أدخل كود SKU للمنتج.");
      return;
    }

    const costPrice = Number(productForm.cost_price || 0);
    const salePrice = Number(productForm.default_sale_price || 0);
    const openingStock = Number(productForm.opening_stock || 0);
    const minimumStock = Number(productForm.minimum_stock || 0);
    const taxRate = Number(productForm.tax_rate || 0);

    if (
      costPrice < 0 ||
      salePrice < 0 ||
      openingStock < 0 ||
      minimumStock < 0
    ) {
      setProductError("الأسعار والكميات لا يمكن أن تكون سالبة.");
      return;
    }

    try {
      setCreatingProduct(true);
      setProductError("");
      setProductSuccess("");

      const result = await erpRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          name: productForm.name.trim(),
          sku: productForm.sku.trim(),
          barcode: productForm.barcode.trim() || null,
          category: productForm.category.trim() || null,
          brand: productForm.brand.trim() || null,
          model: productForm.model.trim() || null,
          unit: productForm.unit.trim() || "قطعة",
          description: productForm.description.trim() || null,
          cost_price: costPrice,
          default_sale_price: salePrice,
          tax_rate: taxRate,
          opening_stock: openingStock,
          minimum_stock: minimumStock,
          default_supplier:
            productForm.default_supplier.trim() || null,
          is_active: Boolean(productForm.is_active),
        }),
      });

      if (result?.success === false) {
        throw new Error(
          result.message || "تعذر إضافة المنتج."
        );
      }

      setProductSuccess(
        result?.message || "تم إضافة المنتج بنجاح."
      );

      setShowAddProductForm(false);
      await loadInventory();
    } catch (error) {
      console.error(error);
      setProductError(
        error.message || "حدث خطأ أثناء إضافة المنتج."
      );
    } finally {
      setCreatingProduct(false);
    }
  };

  const openIssueForm = () => {
    setIssueError("");
    setIssueSuccess("");
    setIssueForm({
      project_id: "",
      product_id: "",
      quantity: "",
      reference: "",
      notes: "",
    });
    setShowIssueForm(true);
  };

  const closeIssueForm = () => {
    if (issuing) return;
    setShowIssueForm(false);
    setIssueError("");
  };

  const handleIssueSubmit = async (event) => {
    event.preventDefault();

    const quantity = Number(issueForm.quantity || 0);

    if (!issueForm.project_id) {
      setIssueError("اختر المشروع أولًا.");
      return;
    }

    if (!issueForm.product_id) {
      setIssueError("اختر المنتج أولًا.");
      return;
    }

    if (quantity <= 0) {
      setIssueError("أدخل كمية صحيحة للصرف.");
      return;
    }

    if (quantity > selectedIssueStock) {
      setIssueError(
        `الكمية المطلوبة أكبر من الرصيد المتاح (${selectedIssueStock}).`
      );
      return;
    }

    try {
      setIssuing(true);
      setIssueError("");
      setIssueSuccess("");

      const result = await erpRequest(
        "/inventory/issue-to-project",
        {
          method: "POST",
          body: JSON.stringify({
            project_id: Number(issueForm.project_id),
            product_id: Number(issueForm.product_id),
            quantity,
            reference: issueForm.reference.trim() || null,
            notes: issueForm.notes.trim() || null,
          }),
        }
      );

      if (result?.success === false) {
        throw new Error(
          result.message ||
            "تعذر صرف المنتج للمشروع."
        );
      }

      setIssueSuccess(
        result?.message ||
          "تم صرف المنتج للمشروع وتحديث المخزون بنجاح."
      );

      setShowIssueForm(false);
      await loadInventory();
    } catch (error) {
      console.error(error);
      setIssueError(
        error.message ||
          "حدث خطأ أثناء صرف المنتج."
      );
    } finally {
      setIssuing(false);
    }
  };

  const openEditProduct = (product) => {
    setEditProductError("");
    setEditingProduct({
      id: product.id,
      name: product.name || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      category: product.category || "",
      brand: product.brand || "",
      model: product.model || "",
      unit: product.unit || "قطعة",
      description: product.description || "",
      cost_price: product.cost_price ?? "",
      default_sale_price: product.default_sale_price ?? "",
      tax_rate: product.tax_rate ?? "15",
      minimum_stock: product.minimum_stock ?? "",
      default_supplier: product.default_supplier || "",
      is_active: Boolean(product.is_active),
    });
  };

  const closeEditProduct = () => {
    if (savingProductEdit) return;
    setEditingProduct(null);
    setEditProductError("");
  };

  const handleEditProductChange = (field, value) => {
    setEditingProduct((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current
    );
  };

  const handleEditProductSubmit = async (event) => {
    event.preventDefault();

    if (!editingProduct) return;

    if (!editingProduct.name.trim()) {
      setEditProductError("أدخل اسم المنتج.");
      return;
    }

    if (!editingProduct.sku.trim()) {
      setEditProductError("أدخل كود SKU للمنتج.");
      return;
    }

    try {
      setSavingProductEdit(true);
      setEditProductError("");
      setProductSuccess("");

      const result = await erpRequest(
        `/products/${editingProduct.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: editingProduct.name.trim(),
            sku: editingProduct.sku.trim(),
            barcode: editingProduct.barcode.trim() || null,
            category: editingProduct.category.trim() || null,
            brand: editingProduct.brand.trim() || null,
            model: editingProduct.model.trim() || null,
            unit: editingProduct.unit.trim() || "قطعة",
            description: editingProduct.description.trim() || null,
            cost_price: Number(editingProduct.cost_price || 0),
            default_sale_price: Number(
              editingProduct.default_sale_price || 0
            ),
            tax_rate: Number(editingProduct.tax_rate || 0),
            minimum_stock: Number(
              editingProduct.minimum_stock || 0
            ),
            default_supplier:
              editingProduct.default_supplier.trim() || null,
            is_active: Boolean(editingProduct.is_active),
          }),
        }
      );

      if (result?.success === false) {
        throw new Error(
          result.message || "تعذر تحديث المنتج."
        );
      }

      setProductSuccess(
        result?.message || "تم تحديث المنتج بنجاح."
      );
      setEditingProduct(null);
      await loadInventory();
    } catch (error) {
      console.error(error);
      setEditProductError(
        error.message || "حدث خطأ أثناء تحديث المنتج."
      );
    } finally {
      setSavingProductEdit(false);
    }
  };

  const toggleProductStatus = async (product) => {
    const nextActive = !Boolean(product.is_active);

    const confirmed = window.confirm(
      nextActive
        ? `هل تريد إعادة تفعيل المنتج "${product.name}"؟`
        : `هل تريد تعطيل المنتج "${product.name}"؟ سيبقى محفوظًا في ERP ولن يدخل في AI Sales matching.`
    );

    if (!confirmed) return;

    try {
      setProductActionId(product.id);
      setProductSuccess("");
      setError("");

      const result = await erpRequest(
        `/products/${product.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            is_active: nextActive,
          }),
        }
      );

      if (result?.success === false) {
        throw new Error(
          result.message || "تعذر تغيير حالة المنتج."
        );
      }

      setProductSuccess(
        nextActive
          ? "تم تفعيل المنتج ومزامنته مع AI Sales."
          : "تم تعطيل المنتج واستبعاده من AI Sales matching."
      );

      await loadInventory();
    } catch (error) {
      console.error(error);
      setError(
        error.message || "حدث خطأ أثناء تغيير حالة المنتج."
      );
    } finally {
      setProductActionId(null);
    }
  };


  if (loading) {
    return (
      <div
        className="inventory-page"
        dir="rtl"
        style={{ padding: "24px" }}
      >
        جاري تحميل المخزون...
      </div>
    );
  }

  return (
    <div
      className="inventory-page"
      dir="rtl"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div
        style={{
          padding: "24px",
          border: "1px solid #e7e9f2",
          borderRadius: "18px",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "#fff1f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Boxes size={24} />
          </div>

          <div>
            <span
              style={{
                color: "#6257ff",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              المخزون
            </span>

            <h1
              style={{
                margin: "4px 0 0",
                fontSize: "26px",
              }}
            >
              إدارة المخزون
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                color: "#9aa0af",
                fontSize: "13px",
              }}
            >
              المنتجات والكميات وحركات الدخول والصرف
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={openAddProductForm}
            style={{
              height: "40px",
              padding: "0 16px",
              border: "none",
              borderRadius: "10px",
              background: "#16a34a",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            <Plus size={17} />
            إضافة منتج
          </button>

          <button
            type="button"
            onClick={openIssueForm}
            style={{
              height: "40px",
              padding: "0 16px",
              border: "none",
              borderRadius: "10px",
              background: "#6257ff",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            <Send size={16} />
            صرف للمشروع
          </button>

          <button
            type="button"
            onClick={loadInventory}
            style={{
              height: "40px",
              padding: "0 16px",
              border: "1px solid #ddd6fe",
              borderRadius: "10px",
              background: "#f5f3ff",
              color: "#6257ff",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
            }}
          >
            <RefreshCcw size={16} />
            تحديث
          </button>
        </div>
      </div>

      {issueSuccess && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#ecfdf3",
            color: "#15803d",
            fontSize: "13px",
          }}
        >
          {issueSuccess}
        </div>
      )}

      {productSuccess && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#ecfdf3",
            color: "#15803d",
            fontSize: "13px",
          }}
        >
          {productSuccess}
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: "#fff1f2",
            color: "#dc2626",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}


      {showAddProductForm && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAddProductForm();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: "rgba(15, 23, 42, 0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <form
            onSubmit={handleAddProductSubmit}
            style={{
              width: "min(860px, 100%)",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #eceef5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  إضافة منتج جديد
                </h3>
                <span
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#9aa0af",
                    fontSize: "12px",
                  }}
                >
                  بيانات المنتج والأسعار والرصيد الافتتاحي
                </span>
              </div>

              <button
                type="button"
                onClick={closeAddProductForm}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "9px",
                  background: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "22px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <IssueField label="اسم المنتج *">
                <input
                  value={productForm.name}
                  onChange={(e) => handleProductChange("name", e.target.value)}
                  placeholder="مثال: كاميرا Hikvision 4MP"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="SKU *">
                <input
                  value={productForm.sku}
                  onChange={(e) => handleProductChange("sku", e.target.value)}
                  placeholder="CAM-001"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الباركود">
                <input
                  value={productForm.barcode}
                  onChange={(e) => handleProductChange("barcode", e.target.value)}
                  placeholder="اختياري"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الفئة">
                <input
                  value={productForm.category}
                  onChange={(e) => handleProductChange("category", e.target.value)}
                  placeholder="كاميرات مراقبة"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="العلامة التجارية">
                <input
                  value={productForm.brand}
                  onChange={(e) => handleProductChange("brand", e.target.value)}
                  placeholder="Hikvision"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الموديل">
                <input
                  value={productForm.model}
                  onChange={(e) => handleProductChange("model", e.target.value)}
                  placeholder="DS-2CD..."
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الوحدة">
                <input
                  value={productForm.unit}
                  onChange={(e) => handleProductChange("unit", e.target.value)}
                  placeholder="قطعة"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="المورد الافتراضي">
                <input
                  value={productForm.default_supplier}
                  onChange={(e) =>
                    handleProductChange("default_supplier", e.target.value)
                  }
                  placeholder="اختياري"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="سعر الشراء">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.cost_price}
                  onChange={(e) =>
                    handleProductChange("cost_price", e.target.value)
                  }
                  placeholder="0.00"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="سعر البيع الافتراضي">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.default_sale_price}
                  onChange={(e) =>
                    handleProductChange("default_sale_price", e.target.value)
                  }
                  placeholder="0.00"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الضريبة %">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.tax_rate}
                  onChange={(e) =>
                    handleProductChange("tax_rate", e.target.value)
                  }
                  placeholder="15"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الحد الأدنى للمخزون">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.minimum_stock}
                  onChange={(e) =>
                    handleProductChange("minimum_stock", e.target.value)
                  }
                  placeholder="0"
                  style={inputStyle}
                />
              </IssueField>

              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "15px",
                  borderRadius: "13px",
                  border: "1px solid #ddd6fe",
                  background: "#faf9ff",
                }}
              >
                <IssueField label="الرصيد الافتتاحي">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.opening_stock}
                    onChange={(e) =>
                      handleProductChange("opening_stock", e.target.value)
                    }
                    placeholder="0"
                    style={inputStyle}
                  />
                </IssueField>

                <div
                  style={{
                    marginTop: "8px",
                    color: "#7c73a8",
                    fontSize: "11px",
                  }}
                >
                  استخدمه فقط للبضاعة الموجودة فعليًا قبل بدء العمل على النظام.
                </div>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <IssueField label="الوصف">
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      handleProductChange("description", e.target.value)
                    }
                    placeholder="مواصفات أو ملاحظات المنتج..."
                    style={{
                      ...inputStyle,
                      height: "88px",
                      paddingTop: "10px",
                      resize: "vertical",
                    }}
                  />
                </IssueField>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "10px",
                  padding: "14px",
                  borderRadius: "13px",
                  background: "#f8fafc",
                  border: "1px solid #eef0f5",
                }}
              >
                <PricePreview
                  label="الربح للوحدة"
                  value={formatMoney(
                    Number(productForm.default_sale_price || 0) -
                      Number(productForm.cost_price || 0)
                  )}
                />
                <PricePreview
                  label="هامش الربح"
                  value={`${
                    Number(productForm.default_sale_price || 0) > 0
                      ? (
                          ((Number(productForm.default_sale_price || 0) -
                            Number(productForm.cost_price || 0)) /
                            Number(productForm.default_sale_price || 0)) *
                          100
                        ).toFixed(2)
                      : "0.00"
                  }%`}
                />
                <PricePreview
                  label="قيمة الرصيد الافتتاحي"
                  value={formatMoney(
                    Number(productForm.opening_stock || 0) *
                      Number(productForm.cost_price || 0)
                  )}
                />
              </div>

              {productError && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontSize: "12px",
                  }}
                >
                  {productError}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #eceef5",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeAddProductForm}
                disabled={creatingProduct}
                style={{
                  height: "40px",
                  padding: "0 18px",
                  border: "1px solid #dfe2ea",
                  borderRadius: "10px",
                  background: "#fff",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={creatingProduct}
                style={{
                  height: "40px",
                  padding: "0 20px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#16a34a",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: creatingProduct ? "not-allowed" : "pointer",
                  opacity: creatingProduct ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Save size={16} />
                {creatingProduct ? "جاري الحفظ..." : "حفظ المنتج"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingProduct && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProduct();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10001,
            background: "rgba(15, 23, 42, 0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <form
            onSubmit={handleEditProductSubmit}
            style={{
              width: "min(860px, 100%)",
              maxHeight: "calc(100vh - 48px)",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "20px",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.18)",
            }}
          >
            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #eceef5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "20px" }}>
                  تعديل المنتج
                </h3>
                <span
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#9aa0af",
                    fontSize: "12px",
                  }}
                >
                  تحديث بيانات المنتج يحدّث AI Sales Catalog تلقائيًا
                </span>
              </div>

              <button
                type="button"
                onClick={closeEditProduct}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "9px",
                  background: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "22px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <IssueField label="اسم المنتج *">
                <input
                  value={editingProduct.name}
                  onChange={(e) =>
                    handleEditProductChange("name", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="SKU *">
                <input
                  value={editingProduct.sku}
                  onChange={(e) =>
                    handleEditProductChange("sku", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الباركود">
                <input
                  value={editingProduct.barcode}
                  onChange={(e) =>
                    handleEditProductChange("barcode", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الفئة">
                <input
                  value={editingProduct.category}
                  onChange={(e) =>
                    handleEditProductChange("category", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="العلامة التجارية">
                <input
                  value={editingProduct.brand}
                  onChange={(e) =>
                    handleEditProductChange("brand", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الموديل">
                <input
                  value={editingProduct.model}
                  onChange={(e) =>
                    handleEditProductChange("model", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الوحدة">
                <input
                  value={editingProduct.unit}
                  onChange={(e) =>
                    handleEditProductChange("unit", e.target.value)
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="المورد الافتراضي">
                <input
                  value={editingProduct.default_supplier}
                  onChange={(e) =>
                    handleEditProductChange(
                      "default_supplier",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="سعر الشراء">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.cost_price}
                  onChange={(e) =>
                    handleEditProductChange(
                      "cost_price",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="سعر البيع الافتراضي">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.default_sale_price}
                  onChange={(e) =>
                    handleEditProductChange(
                      "default_sale_price",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الضريبة %">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.tax_rate}
                  onChange={(e) =>
                    handleEditProductChange(
                      "tax_rate",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="الحد الأدنى للمخزون">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct.minimum_stock}
                  onChange={(e) =>
                    handleEditProductChange(
                      "minimum_stock",
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </IssueField>

              <div style={{ gridColumn: "1 / -1" }}>
                <IssueField label="الوصف">
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) =>
                      handleEditProductChange(
                        "description",
                        e.target.value
                      )
                    }
                    style={{
                      ...inputStyle,
                      height: "88px",
                      paddingTop: "10px",
                      resize: "vertical",
                    }}
                  />
                </IssueField>
              </div>

              <label
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  padding: "12px 14px",
                  border: "1px solid #e7e9f2",
                  borderRadius: "11px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={editingProduct.is_active}
                  onChange={(e) =>
                    handleEditProductChange(
                      "is_active",
                      e.target.checked
                    )
                  }
                />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>
                  المنتج نشط
                </span>
              </label>

              {editProductError && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontSize: "12px",
                  }}
                >
                  {editProductError}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #eceef5",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeEditProduct}
                disabled={savingProductEdit}
                style={{
                  height: "40px",
                  padding: "0 18px",
                  border: "1px solid #dfe2ea",
                  borderRadius: "10px",
                  background: "#fff",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={savingProductEdit}
                style={{
                  height: "40px",
                  padding: "0 20px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#6257ff",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: savingProductEdit
                    ? "not-allowed"
                    : "pointer",
                  opacity: savingProductEdit ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Save size={16} />
                {savingProductEdit
                  ? "جاري الحفظ..."
                  : "حفظ التعديلات"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showIssueForm && (
        <div
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeIssueForm();
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <form
            onSubmit={handleIssueSubmit}
            style={{
              width: "min(620px, 100%)",
              background: "#fff",
              borderRadius: "18px",
              boxShadow:
                "0 24px 70px rgba(15, 23, 42, 0.18)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 22px",
                borderBottom: "1px solid #eceef5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  صرف منتجات للمشروع
                </h3>
                <span
                  style={{
                    display: "block",
                    marginTop: "5px",
                    color: "#9aa0af",
                    fontSize: "12px",
                  }}
                >
                  سيتم خصم الكمية من المخزون وتسجيل حركة OUT
                </span>
              </div>

              <button
                type="button"
                onClick={closeIssueForm}
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "9px",
                  background: "#fff",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                padding: "22px",
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              <IssueField label="المشروع">
                <select
                  value={issueForm.project_id}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      project_id: event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">
                    اختر المشروع
                  </option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                    >
                      {project.name ||
                        project.project_name ||
                        project.title ||
                        `مشروع #${project.id}`}
                    </option>
                  ))}
                </select>
              </IssueField>

              <IssueField label="المنتج">
                <select
                  value={issueForm.product_id}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      product_id: event.target.value,
                      quantity: "",
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="">
                    اختر المنتج
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} — رصيد{" "}
                      {Number(
                        product.stock_quantity || 0
                      )}
                    </option>
                  ))}
                </select>
              </IssueField>

              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "12px 14px",
                  borderRadius: "11px",
                  background: "#f7f7ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <span
                  style={{
                    color: "#7b8190",
                    fontSize: "12px",
                  }}
                >
                  الرصيد الحالي
                </span>

                <strong
                  style={{
                    color: "#6257ff",
                    fontSize: "18px",
                  }}
                >
                  {selectedIssueProduct
                    ? `${selectedIssueStock} ${
                        selectedIssueProduct.unit || "وحدة"
                      }`
                    : "-"}
                </strong>
              </div>

              <IssueField label="الكمية">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={
                    selectedIssueProduct
                      ? selectedIssueStock
                      : undefined
                  }
                  value={issueForm.quantity}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  placeholder="0"
                  style={inputStyle}
                />
              </IssueField>

              <IssueField label="المرجع">
                <input
                  value={issueForm.reference}
                  onChange={(event) =>
                    setIssueForm((current) => ({
                      ...current,
                      reference: event.target.value,
                    }))
                  }
                  placeholder="اختياري"
                  style={inputStyle}
                />
              </IssueField>

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <IssueField label="ملاحظات">
                  <textarea
                    value={issueForm.notes}
                    onChange={(event) =>
                      setIssueForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="مثال: كاميرات مخصصة لتركيب المشروع"
                    style={{
                      ...inputStyle,
                      height: "90px",
                      paddingTop: "10px",
                      resize: "vertical",
                    }}
                  />
                </IssueField>
              </div>

              {issueError && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontSize: "12px",
                  }}
                >
                  {issueError}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "16px 22px",
                borderTop: "1px solid #eceef5",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={closeIssueForm}
                disabled={issuing}
                style={{
                  height: "40px",
                  padding: "0 18px",
                  border: "1px solid #dfe2ea",
                  borderRadius: "10px",
                  background: "#fff",
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={issuing}
                style={{
                  height: "40px",
                  padding: "0 20px",
                  border: "none",
                  borderRadius: "10px",
                  background: "#6257ff",
                  color: "#fff",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: issuing
                    ? "not-allowed"
                    : "pointer",
                  opacity: issuing ? 0.7 : 1,
                }}
              >
                {issuing
                  ? "جاري الصرف..."
                  : "تأكيد الصرف"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
          gap: "14px",
        }}
      >
        <StatCard
          icon={<Package size={20} />}
          label="عدد المنتجات"
          value={totalProducts}
        />

        <StatCard
          icon={<Boxes size={20} />}
          label="إجمالي الوحدات"
          value={totalStock.toLocaleString("en-US")}
        />

        <StatCard
          icon={<AlertTriangle size={20} />}
          label="مخزون منخفض"
          value={lowStockProducts.length}
        />

        <StatCard
          icon={<History size={20} />}
          label="قيمة المخزون"
          value={formatMoney(totalStockValue)}
        />
      </div>

      <div
        style={{
          padding: "22px",
          border: "1px solid #e7e9f2",
          borderRadius: "18px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
              }}
            >
              أرصدة المنتجات
            </h3>

            <span
              style={{
                color: "#9aa0af",
                fontSize: "12px",
              }}
            >
              الرصيد الحالي وحد إعادة الطلب
            </span>
          </div>

          <div
            style={{
              position: "relative",
              width: "320px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                top: "50%",
                right: "12px",
                transform: "translateY(-50%)",
                color: "#9aa0af",
              }}
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث بالاسم أو SKU أو الموديل..."
              style={{
                width: "100%",
                height: "42px",
                border: "1px solid #dfe2ea",
                borderRadius: "11px",
                padding: "0 38px 0 12px",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eceef5",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1.7fr 1fr 0.8fr 0.8fr 0.9fr 1.2fr",
              gap: "12px",
              padding: "12px 14px",
              background: "#fafbfe",
              color: "#8d94a5",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>المنتج</span>
            <span>SKU</span>
            <span>الرصيد</span>
            <span>الحد الأدنى</span>
            <span>الحالة</span>
            <span>الإجراءات</span>
          </div>

          {filteredProducts.length ? (
            filteredProducts.map((product) => {
              const stock = Number(
                product.stock_quantity || 0
              );
              const minimum = Number(
                product.minimum_stock || 0
              );
              const low = stock <= minimum;

              return (
                <div
                  key={product.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.7fr 1fr 0.8fr 0.8fr 0.9fr 1.2fr",
                    gap: "12px",
                    padding: "14px",
                    borderTop:
                      "1px solid #f0f1f6",
                    alignItems: "center",
                    fontSize: "13px",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                      }}
                    >
                      {product.name}
                    </strong>

                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#9aa0af",
                        fontSize: "11px",
                      }}
                    >
                      {product.brand || "-"}
                      {product.model
                        ? ` • ${product.model}`
                        : ""}
                    </span>
                  </div>

                  <span>
                    {product.sku || "-"}
                  </span>

                  <strong>{stock}</strong>

                  <span>{minimum}</span>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "fit-content",
                      padding: "5px 10px",
                      borderRadius: "999px",
                      background: !product.is_active
                        ? "#f3f4f6"
                        : low
                        ? "#fff7ed"
                        : "#ecfdf3",
                      color: !product.is_active
                        ? "#6b7280"
                        : low
                        ? "#ea580c"
                        : "#15803d",
                      fontWeight: 700,
                      fontSize: "11px",
                    }}
                  >
                    {!product.is_active
                      ? "غير نشط"
                      : low
                      ? "مخزون منخفض"
                      : "متوفر"}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEditProduct(product)}
                      style={{
                        height: "32px",
                        padding: "0 10px",
                        border: "1px solid #ddd6fe",
                        borderRadius: "8px",
                        background: "#f5f3ff",
                        color: "#6257ff",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      <Pencil size={13} />
                      تعديل
                    </button>

                    <button
                      type="button"
                      disabled={productActionId === product.id}
                      onClick={() => toggleProductStatus(product)}
                      style={{
                        height: "32px",
                        padding: "0 10px",
                        border: product.is_active
                          ? "1px solid #fecaca"
                          : "1px solid #bbf7d0",
                        borderRadius: "8px",
                        background: product.is_active
                          ? "#fff1f2"
                          : "#ecfdf3",
                        color: product.is_active
                          ? "#dc2626"
                          : "#15803d",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        cursor:
                          productActionId === product.id
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          productActionId === product.id ? 0.6 : 1,
                        fontFamily: "inherit",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      <Power size={13} />
                      {productActionId === product.id
                        ? "جاري..."
                        : product.is_active
                        ? "تعطيل"
                        : "تفعيل"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "22px",
                textAlign: "center",
                color: "#9aa0af",
              }}
            >
              لا توجد منتجات مطابقة.
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "22px",
          border: "1px solid #e7e9f2",
          borderRadius: "18px",
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          <History size={20} />

          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
              }}
            >
              آخر حركات المخزون
            </h3>

            <span
              style={{
                color: "#9aa0af",
                fontSize: "12px",
              }}
            >
              الاستلامات وحركات الدخول والصرف
            </span>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eceef5",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1.4fr 0.7fr 0.7fr 0.8fr 0.8fr 1fr 1.2fr",
              gap: "10px",
              padding: "12px 14px",
              background: "#fafbfe",
              color: "#8d94a5",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>المنتج</span>
            <span>الحركة</span>
            <span>الكمية</span>
            <span>قبل</span>
            <span>بعد</span>
            <span>المرجع</span>
            <span>التاريخ</span>
          </div>

          {transactions.length ? (
            transactions.map((transaction) => {
              const isIn =
                transaction.type === "IN";

              return (
                <div
                  key={transaction.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "1.4fr 0.7fr 0.7fr 0.8fr 0.8fr 1fr 1.2fr",
                    gap: "10px",
                    padding: "14px",
                    alignItems: "center",
                    borderTop:
                      "1px solid #f0f1f6",
                    fontSize: "12px",
                  }}
                >
                  <strong>
                    {transaction.product?.name ||
                      transaction.purchase_order_item
                        ?.product_name ||
                      "-"}
                  </strong>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontWeight: 700,
                      color: isIn
                        ? "#15803d"
                        : "#dc2626",
                    }}
                  >
                    {isIn ? (
                      <ArrowDownToLine size={15} />
                    ) : (
                      <ArrowUpFromLine size={15} />
                    )}

                    {transaction.type}
                  </span>

                  <strong>
                    {transaction.quantity}
                  </strong>

                  <span>
                    {transaction.stock_before}
                  </span>

                  <span>
                    {transaction.stock_after}
                  </span>

                  <span>
                    {transaction.reference ||
                      transaction.purchase_order
                        ?.po_number ||
                      "-"}
                  </span>

                  <span>
                    {formatDateTime(
                      transaction.created_at
                    )}
                  </span>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: "22px",
                textAlign: "center",
                color: "#9aa0af",
              }}
            >
              لا توجد حركات مخزون حتى الآن.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div
      style={{
        padding: "18px",
        border: "1px solid #e7e9f2",
        borderRadius: "16px",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          background: "#f5f3ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6257ff",
        }}
      >
        {icon}
      </div>

      <div>
        <span
          style={{
            display: "block",
            color: "#9aa0af",
            fontSize: "11px",
          }}
        >
          {label}
        </span>

        <strong
          style={{
            display: "block",
            marginTop: "4px",
            fontSize: "18px",
          }}
        >
          {value}
        </strong>
      </div>
    </div>
  );
}


function PricePreview({ label, value }) {
  return (
    <div>
      <span
        style={{
          display: "block",
          color: "#9aa0af",
          fontSize: "11px",
          marginBottom: "5px",
        }}
      >
        {label}
      </span>
      <strong style={{ fontSize: "15px" }}>
        {value}
      </strong>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: "42px",
  border: "1px solid #dfe2ea",
  borderRadius: "10px",
  padding: "0 11px",
  background: "#fff",
  fontFamily: "inherit",
  outline: "none",
};

function IssueField({ label, children }) {
  return (
    <label
      style={{
        display: "block",
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: "6px",
          color: "#6b7280",
          fontSize: "12px",
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}
