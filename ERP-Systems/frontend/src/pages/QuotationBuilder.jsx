import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeDollarSign,
  Boxes,
  Calculator,
  CheckCircle2,
  FileText,
  Package,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Truck,
  Store,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const emptyCommercialTerms = {
  customer_rfq: "",
  prepared_by: "",
  payment_terms: "حسب الاتفاق المعتمد مع العميل",
  delivery_period: "يتم تحديدها حسب توفر المواد وبعد اعتماد الطلب",
  execution_period: "يتم تحديدها حسب نطاق الأعمال والكميات وموقع المشروع",
  warranty: "حسب شروط الضمان الخاصة بالمنتجات والأعمال المقدمة",
  custom_terms: "",
};

const emptyExtraCosts = {
  labor: 0,
  installation: 0,
  freight: 0,
  customs: 0,
  overhead: 0,
  contingency: 0,
  commission: 0,
};


function packageDataToInitialRows(packageData) {
  const packageItems = Array.isArray(packageData?.items)
    ? packageData.items
    : [];

  if (!packageItems.length) return [];

  const packageName = packageData?.package_name || "باقة";

  return packageItems.map((item, index) => ({
    product_id: item.product_id || null,
    supplier_id: null,
    supplier_price_id: null,
    supplier_name: "",
    supplier_cost_snapshot: null,
    supplier_lead_time_snapshot: null,
    supplier_valid_until_snapshot: null,
    row_id: `package-${packageData?.package_id || "x"}-${item.product_id || index}-${index}`,
    name: item.product_name || item.name || "منتج",
    sku: item.sku || "",
    unit: item.unit || "قطعة",
    section: packageName,
    qty: Number(item.quantity ?? item.qty ?? 1),
    cost: Number(item.cost_price ?? item.cost ?? 0),
    sale: Number(item.sale_price ?? item.unit_price ?? item.price ?? 0),
    discount: Number(item.discount_percent ?? item.discount ?? 0),
    tax_rate: Number(item.tax_rate ?? 0),
    stock:
      item.stock !== undefined && item.stock !== null
        ? Number(item.stock)
        : null,
    is_custom: false,
  }));
}

export default function QuotationBuilder({
  onNavigate,
  initialProjectId = null,
  initialQuotationId = null,
  initialPackageData = null,
}) {
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState("");
  const [items, setItems] = useState(() =>
    initialQuotationId
      ? []
      : packageDataToInitialRows(initialPackageData)
  );
  const [targetMargin, setTargetMargin] = useState(25);
  const [taxRate, setTaxRate] = useState(15);
  const [discount, setDiscount] = useState(0);
  const [extraCosts, setExtraCosts] = useState(emptyExtraCosts);
  const [commercialTerms, setCommercialTerms] = useState(emptyCommercialTerms);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [quotationId, setQuotationId] = useState(initialQuotationId || null);
  const [openingDraft, setOpeningDraft] = useState(false);
  const [quotationStatus, setQuotationStatus] = useState("draft");
  const [submittingApproval, setSubmittingApproval] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [supplierModalRow, setSupplierModalRow] = useState(null);
  const [supplierPrices, setSupplierPrices] = useState([]);
  const [supplierPricesLoading, setSupplierPricesLoading] = useState(false);
  const [supplierPricesError, setSupplierPricesError] = useState("");
  const [pricingChecks, setPricingChecks] = useState({});
  const [pricingChecking, setPricingChecking] = useState(false);
  const [alternativeModalRow, setAlternativeModalRow] = useState(null);
  const [alternativeRows, setAlternativeRows] = useState([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [alternativesError, setAlternativesError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [pRes, prRes] = await Promise.all([
          fetch(`${API_URL}/products`, {
            headers: { Accept: "application/json" },
          }),
          fetch(`${API_URL}/projects`, {
            headers: { Accept: "application/json" },
          }),
        ]);

        const [pJson, prJson] = await Promise.all([
          pRes.json(),
          prRes.json(),
        ]);

        if (cancelled) return;

        setProducts(Array.isArray(pJson?.data) ? pJson.data : []);
        setProjects(Array.isArray(prJson?.data) ? prJson.data : []);
      } catch (error) {
        console.error("Quotation builder load error:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);



  useEffect(() => {
    if (
      initialQuotationId ||
      !initialPackageData ||
      !Array.isArray(initialPackageData?.items) ||
      !initialPackageData.items.length
    ) {
      return;
    }

    setProductsOpen(false);
    setSummaryOpen(false);
    setSaveMessage(
      `تم إضافة باقة ${
        initialPackageData?.package_name || ""
      } إلى الـ BOQ بنجاح (${initialPackageData.items.length} بند).`
    );
  }, [initialQuotationId, initialPackageData]);

  useEffect(() => {
    if (initialQuotationId || !products.length) return;

    const raw = sessionStorage.getItem("masa_calculator_to_boq");
    if (!raw) return;

    try {
      const selection = JSON.parse(raw);

      const product = products.find(
        (row) =>
          String(row.id) ===
          String(selection?.product_id)
      );

      if (!product) {
        setSaveMessage(
          "تم فتح الـ BOQ لكن تعذر العثور على المنتج القادم من حاسبة السعر المقترح."
        );
        sessionStorage.removeItem(
          "masa_calculator_to_boq"
        );
        return;
      }

      setItems((current) => {
        const supplierFields = {
          supplier_id:
            selection?.supplier_id || null,
          supplier_price_id:
            selection?.supplier_price_id || null,
          supplier_name:
            selection?.supplier_name || "",
          supplier_cost_snapshot: Number(
            selection?.supplier_cost_snapshot ||
              0
          ),
          supplier_lead_time_snapshot:
            selection?.supplier_lead_time_snapshot !==
              null &&
            selection?.supplier_lead_time_snapshot !==
              undefined
              ? Number(
                  selection.supplier_lead_time_snapshot
                )
              : null,
          supplier_valid_until_snapshot:
            selection?.supplier_valid_until_snapshot ||
            null,
          cost: Number(
            selection?.supplier_cost_snapshot ||
              product.cost_price ||
              0
          ),
          sale: Number(
            selection?.suggested_sale_price ||
              product.default_sale_price ||
              0
          ),
        };

        const existingIndex =
          current.findIndex(
            (row) =>
              String(row.product_id) ===
              String(product.id)
          );

        if (existingIndex >= 0) {
          return current.map((row, index) =>
            index === existingIndex
              ? {
                  ...row,
                  ...supplierFields,
                }
              : row
          );
        }

        return [
          ...current,
          {
            product_id: product.id,
            ...supplierFields,
            row_id: `product-${product.id}`,
            name: product.name,
            sku: product.sku || "",
            unit: product.unit || "قطعة",
            section: "عام",
            qty: 1,
            discount: 0,
            tax_rate: Number(
              product.tax_rate || 0
            ),
            stock: Number(
              product.stock_quantity || 0
            ),
            is_custom: false,
          },
        ];
      });

      setProductsOpen(false);
      setSaveMessage(
        `تم إضافة ${product.name} من حاسبة السعر المقترح بسعر بيع ${money(
          selection?.suggested_sale_price || 0
        )} ر.س.`
      );

      sessionStorage.removeItem(
        "masa_calculator_to_boq"
      );
    } catch (error) {
      console.error(
        "Calculator to BOQ handoff error:",
        error
      );

      sessionStorage.removeItem(
        "masa_calculator_to_boq"
      );

      setSaveMessage(
        "تعذر نقل السعر المقترح إلى الـ BOQ."
      );
    }
  }, [products, initialQuotationId]);

  useEffect(() => {
    // استقبال اختيار المورد القادم من شاشة مقارنة أسعار الموردين.
    // لا نحقنه تلقائيًا داخل Quotation محفوظ تم فتحه للتعديل.
    if (initialQuotationId || !products.length) return;

    const raw = sessionStorage.getItem("masa_supplier_to_boq");
    if (!raw) return;

    try {
      const selection = JSON.parse(raw);
      const product = products.find(
        (row) => String(row.id) === String(selection?.product_id)
      );

      if (!product) {
        setSaveMessage(
          "تم فتح الـ BOQ لكن تعذر العثور على المنتج المختار من مقارنة الموردين."
        );
        sessionStorage.removeItem("masa_supplier_to_boq");
        return;
      }

      setItems((current) => {
        const supplierFields = {
          supplier_id: selection?.supplier_id || null,
          supplier_price_id: selection?.supplier_price_id || null,
          supplier_name: selection?.supplier_name || "مورد",
          supplier_cost_snapshot: Number(
            selection?.supplier_cost_snapshot || 0
          ),
          supplier_lead_time_snapshot:
            selection?.supplier_lead_time_snapshot !== null &&
            selection?.supplier_lead_time_snapshot !== undefined
              ? Number(selection.supplier_lead_time_snapshot)
              : null,
          supplier_valid_until_snapshot:
            selection?.supplier_valid_until_snapshot || null,
          cost: Number(selection?.supplier_cost_snapshot || 0),
        };

        const existingIndex = current.findIndex(
          (row) => String(row.product_id) === String(product.id)
        );

        if (existingIndex >= 0) {
          return current.map((row, index) =>
            index === existingIndex
              ? { ...row, ...supplierFields }
              : row
          );
        }

        return [
          ...current,
          {
            product_id: product.id,
            ...supplierFields,
            row_id: `product-${product.id}`,
            name: product.name,
            sku: product.sku || "",
            unit: product.unit || "قطعة",
            section: "عام",
            qty: 1,
            sale: Number(product.default_sale_price || 0),
            discount: 0,
            tax_rate: Number(product.tax_rate || 0),
            stock: Number(product.stock_quantity || 0),
            is_custom: false,
          },
        ];
      });

      setProductsOpen(false);
      setSaveMessage(
        `تم إضافة ${product.name} واختيار ${
          selection?.supplier_name || "المورد"
        } بتكلفة ${money(selection?.supplier_cost_snapshot || 0)} ر.س.`
      );

      sessionStorage.removeItem("masa_supplier_to_boq");
    } catch (error) {
      console.error("Supplier to BOQ handoff error:", error);
      sessionStorage.removeItem("masa_supplier_to_boq");
      setSaveMessage("تعذر نقل اختيار المورد إلى الـ BOQ.");
    }
  }, [products, initialQuotationId]);

  useEffect(() => {
    const raw = sessionStorage.getItem("masa_costing_to_boq");
    if (!raw) return;

    try {
      const handoff = JSON.parse(raw);
      const snapshot = handoff?.boq_snapshot || {};

      if (snapshot.project_id) setProjectId(String(snapshot.project_id));
      if (snapshot.quotation_id) setQuotationId(snapshot.quotation_id);
      if (Array.isArray(snapshot.items)) setItems(snapshot.items);
      if (snapshot.discount !== undefined) setDiscount(Number(snapshot.discount || 0));
      if (handoff.target_margin !== undefined) setTargetMargin(Number(handoff.target_margin || 0));
      if (handoff.tax_rate !== undefined) setTaxRate(Number(handoff.tax_rate || 0));
      if (handoff.extra_costs) setExtraCosts({ ...emptyExtraCosts, ...handoff.extra_costs });

      const recommended = Number(handoff.recommended_price || 0);
      const sourceItems = Array.isArray(snapshot.items) ? snapshot.items : [];
      const sourceSale = sourceItems.reduce((sum, row) => {
        const gross = Number(row.qty || 0) * Number(row.sale || 0);
        return sum + Math.max(0, gross - Number(row.discount || 0));
      }, 0);

      if (recommended > 0 && sourceSale > 0) {
        const factor = recommended / sourceSale;
        setItems(sourceItems.map((row) => ({
          ...row,
          sale: Number((Number(row.sale || 0) * factor).toFixed(2)),
        })));
      }

      setPricingChecks({});
      setSaveMessage(`تم تطبيق Costing Engine على عرض السعر. السعر المقترح: ${money(recommended)} ر.س.`);
      sessionStorage.removeItem("masa_costing_to_boq");
      sessionStorage.removeItem("masa_boq_to_costing");
    } catch (error) {
      console.error("Costing to BOQ handoff error:", error);
      sessionStorage.removeItem("masa_costing_to_boq");
      setSaveMessage("تعذر تطبيق نتيجة Costing Engine على الـ BOQ.");
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("masa_costing_to_boq")) return;
    if (!initialProjectId || !initialQuotationId) return;

    let cancelled = false;

    async function openExistingDraft() {
      setOpeningDraft(true);
      setSaveMessage("");

      try {
        const response = await fetch(
          `${API_URL}/projects/${initialProjectId}/quotations/${initialQuotationId}`,
          { headers: { Accept: "application/json" } }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || "تعذر فتح المسودة.");
        }

        const quotation = json?.data;

        if (!quotation) {
          throw new Error("لم يتم العثور على بيانات المسودة.");
        }

        if (cancelled) return;

        setProjectId(String(initialProjectId));
        setQuotationId(quotation.id);
        setQuotationStatus(quotation.status || "draft");
        setTargetMargin(Number(quotation.target_margin ?? 25));
        setTaxRate(Number(quotation.header_tax_rate ?? 15));
        setDiscount(Number(quotation.discount ?? 0));

        setExtraCosts({
          ...emptyExtraCosts,
          ...(quotation.extra_costs || {}),
        });
        setCommercialTerms({
          ...emptyCommercialTerms,
          ...(quotation.commercial_terms || {}),
        });

        setItems(
          (quotation.items || []).map((item, index) => ({
            product_id: item.product_id || null,
            supplier_id: item.supplier_id || null,
            supplier_price_id: item.supplier_price_id || null,
            supplier_name: item.supplier_name_snapshot || item.supplier?.name || "",
            supplier_cost_snapshot: item.supplier_cost_snapshot ?? item.cost_price ?? null,
            supplier_lead_time_snapshot: item.supplier_lead_time_snapshot ?? null,
            supplier_valid_until_snapshot: item.supplier_valid_until_snapshot || null,
            row_id: `saved-${item.id || index}`,
            sku: item.sku || "",
            name: item.product_name || "",
            description: item.description || "",
            unit: item.unit || "قطعة",
            section: item.section || "عام",
            qty: Number(item.quantity || 0),
            cost: Number(item.cost_price || 0),
            sale: Number(item.unit_price || 0),
            discount: Number(item.discount || 0),
            tax_rate: Number(item.tax_rate || quotation.header_tax_rate || 15),
            stock: null,
            is_custom:
              item.item_type === "custom" ||
              item.item_type === "service" ||
              !item.product_id,
          }))
        );

        setSaveMessage(
          `تم فتح ${quotation.quotation_number || "المسودة"} للتعديل.`
        );
      } catch (error) {
        console.error("Open quotation draft error:", error);
        if (!cancelled) {
          setSaveMessage(error.message || "تعذر فتح المسودة.");
        }
      } finally {
        if (!cancelled) setOpeningDraft(false);
      }
    }

    openExistingDraft();

    return () => {
      cancelled = true;
    };
  }, [initialProjectId, initialQuotationId]);

  const filteredProducts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return products.slice(0, 12);

    return products
      .filter((p) =>
        [p.name, p.sku, p.brand, p.model, p.category]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      )
      .slice(0, 20);
  }, [products, search]);

  const totals = useMemo(() => {
    const itemsCost = items.reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.cost || 0),
      0
    );

    const itemsSale = items.reduce((sum, item) => {
      const gross =
        Number(item.qty || 0) * Number(item.sale || 0);
      const rowDiscount = Math.min(
        gross,
        Number(item.discount || 0)
      );
      return sum + Math.max(0, gross - rowDiscount);
    }, 0);

    const extras = Object.values(extraCosts).reduce(
      (sum, value) => sum + Number(value || 0),
      0
    );

    const totalCost = itemsCost + extras;
    const subtotalBeforeDiscount = itemsSale;
    const discountAmount = Math.min(
      subtotalBeforeDiscount,
      Number(discount || 0)
    );
    const netBeforeTax = Math.max(
      0,
      subtotalBeforeDiscount - discountAmount
    );
    const tax = netBeforeTax * (Number(taxRate || 0) / 100);
    const grandTotal = netBeforeTax + tax;

    const profit = netBeforeTax - totalCost;
    const margin =
      netBeforeTax > 0 ? (profit / netBeforeTax) * 100 : 0;
    const markup =
      totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const targetSale =
      totalCost > 0 && Number(targetMargin) < 100
        ? totalCost / (1 - Number(targetMargin || 0) / 100)
        : 0;

    return {
      itemsCost,
      itemsSale,
      extras,
      totalCost,
      discountAmount,
      netBeforeTax,
      tax,
      grandTotal,
      profit,
      margin,
      markup,
      targetSale,
    };
  }, [items, extraCosts, discount, taxRate, targetMargin]);

  const addProduct = (product) => {
    setItems((current) => {
      const found = current.find(
        (row) => String(row.product_id) === String(product.id)
      );

      if (found) {
        return current.map((row) =>
          String(row.product_id) === String(product.id)
            ? { ...row, qty: Number(row.qty || 0) + 1 }
            : row
        );
      }

      return [
        ...current,
        {
          product_id: product.id,
          supplier_id: null,
          supplier_price_id: null,
          supplier_name: "",
          supplier_cost_snapshot: null,
          supplier_lead_time_snapshot: null,
          supplier_valid_until_snapshot: null,
          row_id: `product-${product.id}`,
          name: product.name,
          sku: product.sku || "",
          unit: product.unit || "قطعة",
          section: "عام",
          qty: 1,
          cost: Number(product.cost_price || 0),
          sale: Number(product.default_sale_price || 0),
          discount: 0,
          tax_rate: Number(product.tax_rate || 0),
          stock: Number(product.stock_quantity || 0),
          is_custom: false,
        },
      ];
    });
  };

  const addCustomRow = () => {
    setItems((current) => [
      ...current,
      {
        product_id: null,
        supplier_id: null,
        supplier_price_id: null,
        supplier_name: "",
        supplier_cost_snapshot: null,
        supplier_lead_time_snapshot: null,
        supplier_valid_until_snapshot: null,
        row_id: `custom-${Date.now()}-${Math.random()}`,
        sku: "",
        name: "",
        unit: "قطعة",
        section: "عام",
        qty: 1,
        cost: 0,
        sale: 0,
        discount: 0,
        stock: null,
        is_custom: true,
      },
    ]);
  };

  const updateRow = (rowKey, field, value) => {
    setItems((current) =>
      current.map((row) => {
        const key = row.row_id || `product-${row.product_id}`;
        if (key !== rowKey) return row;

        const numericFields = ["qty", "cost", "sale", "discount"];

        if (["cost", "sale", "discount"].includes(field)) {
          setPricingChecks((currentChecks) => {
            if (!currentChecks[key]) return currentChecks;
            const nextChecks = { ...currentChecks };
            delete nextChecks[key];
            return nextChecks;
          });
        }

        return {
          ...row,
          [field]: numericFields.includes(field)
            ? Number(value || 0)
            : value,
        };
      })
    );
  };

  const duplicateRow = (rowKey) => {
    setItems((current) => {
      const row = current.find(
        (item) =>
          (item.row_id || `product-${item.product_id}`) === rowKey
      );

      if (!row) return current;

      return [
        ...current,
        {
          ...row,
          product_id: row.is_custom ? null : row.product_id,
          row_id: `copy-${Date.now()}-${Math.random()}`,
          is_custom: true,
          name: row.name ? `${row.name} - نسخة` : "",
        },
      ];
    });
  };

  const removeRow = (rowKey) => {
    setItems((current) =>
      current.filter(
        (row) =>
          (row.row_id || `product-${row.product_id}`) !== rowKey
      )
    );
  };

  const focusCell = (rowIndex, field) => {
    requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-boq-row="${rowIndex}"][data-boq-field="${field}"]`
      );
      el?.focus();
      el?.select?.();
    });
  };

  const addCustomRowAndFocus = (field = "name") => {
    const nextIndex = items.length;
    addCustomRow();
    focusCell(nextIndex, field);
  };

  const handleCellKeyDown = (event, rowIndex, field) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (rowIndex === items.length - 1) {
        addCustomRowAndFocus(field);
      } else {
        focusCell(rowIndex + 1, field);
      }
    }
  };

  const handlePasteRows = (event) => {
    const pasted = event.clipboardData?.getData("text");
    if (!pasted || (!pasted.includes("\\t") && !pasted.includes("\\n"))) {
      return;
    }

    event.preventDefault();

    const lines = pasted
      .split(/\\r?\\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean);

    if (!lines.length) return;

    const newRows = lines.map((line, index) => {
      const cols = line.split("\\t");

      return {
        product_id: null,
        row_id: `paste-${Date.now()}-${index}-${Math.random()}`,
        sku: cols[0] || "",
        name: cols[1] || cols[0] || "",
        unit: cols[2] || "قطعة",
        section: cols[3] || "عام",
        qty: Number(cols[4] || 1),
        cost: Number(cols[5] || 0),
        sale: Number(cols[6] || 0),
        discount: Number(cols[7] || 0),
        stock: null,
        is_custom: true,
      };
    });

    setItems((current) => [...current, ...newRows]);
  };

  const updateItem = (productId, field, value) => {
    setItems((current) =>
      current.map((row) =>
        String(row.product_id) === String(productId)
          ? {
              ...row,
              [field]:
                field === "qty" || field === "cost" || field === "sale"
                  ? Number(value || 0)
                  : value,
            }
          : row
      )
    );
  };

  const removeItem = (productId) => {
    setItems((current) =>
      current.filter(
        (row) => String(row.product_id) !== String(productId)
      )
    );
  };

  const openSupplierPrices = async (rowKey) => {
    const row = items.find(
      (item) => (item.row_id || `product-${item.product_id}`) === rowKey
    );

    if (!row?.product_id) {
      setSaveMessage("مقارنة الموردين متاحة للمنتجات المرتبطة بالمخزون فقط.");
      return;
    }

    setSupplierModalRow(rowKey);
    setSupplierPrices([]);
    setSupplierPricesError("");
    setSupplierPricesLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/products/${row.product_id}/supplier-prices`,
        { headers: { Accept: "application/json" } }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "تعذر تحميل أسعار الموردين.");
      }

      setSupplierPrices(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error("Supplier prices error:", error);
      setSupplierPricesError(error.message || "تعذر تحميل أسعار الموردين.");
    } finally {
      setSupplierPricesLoading(false);
    }
  };

  const chooseSupplierPrice = (priceRow) => {
    if (!supplierModalRow) return;

    setItems((current) =>
      current.map((row) => {
        const key = row.row_id || `product-${row.product_id}`;
        if (key !== supplierModalRow) return row;

        return {
          ...row,
          supplier_id: priceRow.supplier_id || null,
          supplier_price_id: priceRow.id || null,
          supplier_name: priceRow.supplier?.name || "مورد",
          supplier_cost_snapshot: Number(priceRow.unit_price || 0),
          supplier_lead_time_snapshot:
            priceRow.lead_time_days !== null &&
            priceRow.lead_time_days !== undefined
              ? Number(priceRow.lead_time_days)
              : null,
          supplier_valid_until_snapshot: priceRow.valid_until || null,
          cost: Number(priceRow.unit_price || 0),
        };
      })
    );

    setSupplierModalRow(null);
    setSupplierPrices([]);
  };

  const openProductAlternatives = async (rowKey) => {
    const row = items.find((item) => (item.row_id || `product-${item.product_id}`) === rowKey);
    if (!row?.product_id) {
      setSaveMessage("بدائل المنتجات متاحة للمنتجات المرتبطة بالمخزون فقط.");
      return;
    }
    setAlternativeModalRow(rowKey);
    setAlternativeRows([]);
    setAlternativesError("");
    setAlternativesLoading(true);
    try {
      const response = await fetch(`${API_URL}/products/${row.product_id}/alternatives`, { headers: { Accept: "application/json" } });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.message || "تعذر تحميل بدائل المنتج.");
      setAlternativeRows(Array.isArray(json?.data) ? json.data : []);
    } catch (error) {
      console.error("Product alternatives error:", error);
      setAlternativesError(error.message || "تعذر تحميل بدائل المنتج.");
    } finally {
      setAlternativesLoading(false);
    }
  };

  const chooseProductAlternative = (alternativeRow) => {
    if (!alternativeModalRow) return;
    const product = alternativeRow?.alternative_product;
    if (!product?.id) return;
    const comparison = alternativeRow?.comparison || {};
    const supplierPrice = comparison.best_supplier_price || null;

    setItems((current) => current.map((row) => {
      const key = row.row_id || `product-${row.product_id}`;
      if (key !== alternativeModalRow) return row;
      return {
        ...row,
        product_id: product.id,
        name: product.name || row.name,
        sku: product.sku || "",
        unit: product.unit || row.unit || "قطعة",
        cost: Number(supplierPrice?.unit_price ?? comparison.best_cost ?? product.cost_price ?? 0),
        sale: Number(product.default_sale_price || 0),
        tax_rate: Number(product.tax_rate ?? row.tax_rate ?? 0),
        stock: Number(product.stock_quantity || 0),
        supplier_id: supplierPrice?.supplier_id || null,
        supplier_price_id: supplierPrice?.id || null,
        supplier_name: supplierPrice?.supplier?.name || "",
        supplier_cost_snapshot: supplierPrice?.unit_price !== undefined ? Number(supplierPrice.unit_price || 0) : null,
        supplier_lead_time_snapshot: supplierPrice?.lead_time_days !== null && supplierPrice?.lead_time_days !== undefined ? Number(supplierPrice.lead_time_days) : null,
        supplier_valid_until_snapshot: supplierPrice?.valid_until || null,
        original_product_id: row.original_product_id || row.product_id || null,
        original_product_name: row.original_product_name || row.name || "",
        alternative_relation_id: alternativeRow.id || null,
        is_custom: false,
      };
    }));

    setPricingChecks((current) => {
      const next = { ...current };
      delete next[alternativeModalRow];
      return next;
    });
    setAlternativeModalRow(null);
    setAlternativeRows([]);
    setSaveMessage(`تم استبدال المنتج بـ ${product.name || "البديل"} داخل الـ BOQ.`);
  };

  const runPricingRulesCheck = async ({ silent = false } = {}) => {
    const rowsToCheck = items.filter((row) => {
      const hasName = Boolean(String(row.name || "").trim());
      const hasCost = Number(row.cost || 0) > 0;
      const hasSale = Number(row.sale || 0) > 0;

      // افحص أي بند فعلي: منتج مخزون أو صف حر،
      // حتى لو لم يُكتب اسم البند بعد، طالما توجد تكلفة أو قيمة بيع.
      return hasName || hasCost || hasSale;
    });

    if (!rowsToCheck.length) {
      if (!silent) {
        setSaveMessage("أضف بندًا واحدًا على الأقل قبل فحص قواعد التسعير.");
      }

      return {
        blocked: false,
        needsApproval: false,
        results: {},
      };
    }

    setPricingChecking(true);

    try {
      const results = {};

      await Promise.all(
        rowsToCheck.map(async (row) => {
          const rowKey = row.row_id || `product-${row.product_id}`;
          const grossSale =
            Number(row.qty || 0) * Number(row.sale || 0);
          const discountPercent =
            grossSale > 0
              ? (Number(row.discount || 0) / grossSale) * 100
              : 0;

          const response = await fetch(`${API_URL}/pricing-rules/resolve`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              product_id: row.is_custom ? null : row.product_id || null,
              cost: Number(row.cost || 0),
              sale_price: Number(row.sale || 0),
              discount_percent: Number(discountPercent.toFixed(4)),
            }),
          });

          const json = await response.json();

          if (!response.ok || !json?.success) {
            throw new Error(
              json?.message ||
                Object.values(json?.errors || {})?.flat()?.[0] ||
                `تعذر فحص قاعدة التسعير للبند ${row.name || row.sku || "صف حر"}.`
            );
          }

          const data = json?.data || {};
          const currentMargin = Number(data.current_margin_percent ?? 0);
          const minimumMargin = Number(
            data.rule?.minimum_margin_percent ?? 0
          );
          const targetRuleMargin = Number(
            data.rule?.target_margin_percent ?? 0
          );
          const belowMinimum =
            Number(row.sale || 0) > 0 && currentMargin < minimumMargin;
          const belowTarget =
            Number(row.sale || 0) > 0 && currentMargin < targetRuleMargin;

          const blocked =
            Boolean(data.block_below_minimum_margin) && belowMinimum;
          const needsApproval =
            !blocked &&
            Boolean(data.require_approval_below_target) &&
            belowTarget;

          results[rowKey] = {
            ...data,
            below_minimum: belowMinimum,
            below_target: belowTarget,
            blocked,
            needs_approval: needsApproval,
            status: blocked
              ? "blocked"
              : needsApproval
              ? "approval"
              : "allowed",
          };
        })
      );

      setPricingChecks(results);

      const blockedCount = Object.values(results).filter(
        (row) => row.blocked
      ).length;
      const approvalCount = Object.values(results).filter(
        (row) => row.needs_approval
      ).length;

      if (!silent) {
        if (blockedCount) {
          setSaveMessage(
            `فحص قواعد التسعير: يوجد ${blockedCount} بند مخالف للحد الأدنى ولا يمكن إرساله للموافقة.`
          );
        } else if (approvalCount) {
          setSaveMessage(
            `فحص قواعد التسعير: يوجد ${approvalCount} بند أقل من Target ويحتاج موافقة.`
          );
        } else {
          setSaveMessage("تم فحص قواعد التسعير وكل البنود ضمن الحدود المسموحة.");
        }
      }

      return {
        blocked: blockedCount > 0,
        needsApproval: approvalCount > 0,
        results,
      };
    } catch (error) {
      console.error("Pricing rules check error:", error);

      if (!silent) {
        setSaveMessage(error.message || "تعذر فحص قواعد التسعير.");
      }

      return {
        blocked: true,
        needsApproval: false,
        results: {},
        error,
      };
    } finally {
      setPricingChecking(false);
    }
  };

  const applyRecommendedPrice = (rowKey) => {
    const check = pricingChecks[rowKey];
    if (!check) return;

    const recommended = Number(check.recommended_price || 0);
    if (recommended <= 0) return;

    updateRow(rowKey, "sale", Number(recommended.toFixed(2)));

    setPricingChecks((current) => {
      const next = { ...current };
      delete next[rowKey];
      return next;
    });
  };

  const applyTargetMargin = () => {
    const totalCost = totals.totalCost;
    if (totalCost <= 0 || Number(targetMargin) >= 100) return;

    const targetRevenue =
      totalCost / (1 - Number(targetMargin || 0) / 100);

    const currentSale = items.reduce((sum, row) => {
      const gross =
        Number(row.qty || 0) * Number(row.sale || 0);
      return (
        sum +
        Math.max(0, gross - Number(row.discount || 0))
      );
    }, 0);

    if (currentSale <= 0) return;

    const factor = targetRevenue / currentSale;

    setItems((current) =>
      current.map((row) => ({
        ...row,
        sale: Number((Number(row.sale || 0) * factor).toFixed(2)),
      }))
    );
  };

  const openCostingEngine = () => {
    const boqSnapshot = {
      project_id: projectId || initialProjectId || null,
      quotation_id: quotationId || initialQuotationId || null,
      items,
      discount: Number(discount || 0),
      target_margin: Number(targetMargin || 0),
      tax_rate: Number(taxRate || 0),
      extra_costs: extraCosts,
      material_cost: Number(totals.itemsCost || 0),
      current_sale: Number(totals.netBeforeTax || 0),
    };

    sessionStorage.setItem("masa_boq_to_costing", JSON.stringify(boqSnapshot));
    onNavigate?.("pricing-costing");
  };

  const buildPayload = () => ({
    discount: Number(discount || 0),
    target_margin: Number(targetMargin || 0),
    header_tax_rate: Number(taxRate || 0),
    extra_costs: extraCosts,
    commercial_terms: commercialTerms,
    items: items
      .filter((row) => String(row.name || "").trim())
      .map((row, index) => ({
        product_id: row.is_custom ? null : row.product_id || null,
        supplier_id: row.supplier_id || null,
        supplier_price_id: row.supplier_price_id || null,
        supplier_name_snapshot: row.supplier_name || null,
        supplier_cost_snapshot:
          row.supplier_cost_snapshot !== null &&
          row.supplier_cost_snapshot !== undefined
            ? Number(row.supplier_cost_snapshot)
            : null,
        supplier_lead_time_snapshot:
          row.supplier_lead_time_snapshot !== null &&
          row.supplier_lead_time_snapshot !== undefined
            ? Number(row.supplier_lead_time_snapshot)
            : null,
        supplier_valid_until_snapshot:
          row.supplier_valid_until_snapshot || null,
        product_name: String(row.name || "").trim(),
        sku: row.sku || null,
        description: row.description || null,
        unit: row.unit || "قطعة",
        section: row.section || "عام",
        item_type: row.is_custom ? "custom" : "inventory",
        quantity: Number(row.qty || 0),
        cost_price: Number(row.cost || 0),
        unit_price: Number(row.sale || 0),
        discount: Number(row.discount || 0),
        tax_rate: Number(taxRate || 0),
        sort_order: index,
      })),
  });

  const saveDraft = async () => {
    setSaveMessage("");

    if (!projectId) {
      setSaveMessage("اختر المشروع أولًا.");
      return;
    }

    const payload = buildPayload();

    if (!payload.items.length) {
      setSaveMessage("أضف بندًا واحدًا على الأقل قبل الحفظ.");
      return;
    }

    if (payload.items.some((row) => row.quantity <= 0)) {
      setSaveMessage("كل بند يجب أن تكون كميته أكبر من صفر.");
      return;
    }

    setSaving(true);

    try {
      let targetQuotationId = quotationId;

      if (!targetQuotationId) {
        const listRes = await fetch(
          `${API_URL}/projects/${projectId}/quotations`,
          { headers: { Accept: "application/json" } }
        );

        if (listRes.ok) {
          const listJson = await listRes.json();
          const rows = Array.isArray(listJson?.data)
            ? listJson.data
            : [];

          const draft = rows
            .filter((row) => row.status === "draft")
            .sort(
              (a, b) =>
                Number(b.version || 0) - Number(a.version || 0)
            )[0];

          if (draft) {
            targetQuotationId = draft.id;
            setQuotationId(draft.id);
          }
        }
      }

      const url = targetQuotationId
        ? `${API_URL}/projects/${projectId}/quotations/${targetQuotationId}`
        : `${API_URL}/projects/${projectId}/quotations`;

      const method = targetQuotationId ? "PUT" : "POST";

      let response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      let json = await response.json();

      /*
       * لو المشروع عنده عرض معتمد بالفعل ومفيش Draft،
       * ننشئ Revision بالطريقة الرسمية من آخر عرض معتمد،
       * ثم نحفظ محتوى الـBOQ داخل الـRevision الجديد.
       */
      if (
        !response.ok &&
        !targetQuotationId &&
        String(json?.message || "").includes("استخدم إنشاء Revision جديد")
      ) {
        const listRes = await fetch(
          `${API_URL}/projects/${projectId}/quotations`,
          { headers: { Accept: "application/json" } }
        );

        const listJson = await listRes.json();
        const quotationRows = Array.isArray(listJson?.data)
          ? listJson.data
          : [];

        const latestApproved = quotationRows
          .filter((row) => row.status === "approved")
          .sort(
            (a, b) =>
              Number(b.version || 0) - Number(a.version || 0)
          )[0];

        if (!latestApproved) {
          throw new Error(
            "يوجد عرض سابق للمشروع ولكن لم أجد آخر عرض معتمد."
          );
        }

        setSaveMessage(
          `جاري إنشاء Revision جديد من ${latestApproved.quotation_number || `V${latestApproved.version}`}...`
        );

        const revisionRes = await fetch(
          `${API_URL}/projects/${projectId}/quotations/${latestApproved.id}/revision`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({}),
          }
        );

        const revisionJson = await revisionRes.json();

        if (!revisionRes.ok) {
          throw new Error(
            revisionJson?.message ||
              "تعذر إنشاء Revision جديد لهذا المشروع."
          );
        }

        const revision = revisionJson?.data;

        if (!revision?.id) {
          throw new Error("تم إنشاء Revision لكن لم يصل رقم المسودة.");
        }

        targetQuotationId = revision.id;
        setQuotationId(revision.id);

        response = await fetch(
          `${API_URL}/projects/${projectId}/quotations/${revision.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        json = await response.json();
      }

      if (!response.ok) {
        throw new Error(
          json?.message ||
            Object.values(json?.errors || {})?.flat()?.[0] ||
            "تعذر حفظ عرض السعر."
        );
      }

      const saved = json?.data;

      if (saved?.id) {
        setQuotationId(saved.id);
      }

      setQuotationStatus(saved?.status || "draft");

      setSaveMessage(
        `تم حفظ ${saved?.quotation_number || "عرض السعر"} كمسودة بنجاح.`
      );
    } catch (error) {
      console.error("Save quotation error:", error);
      setSaveMessage(error.message || "تعذر حفظ عرض السعر.");
    } finally {
      setSaving(false);
    }
  };

  const submitForApproval = async () => {
    setSaveMessage("");

    if (!projectId || !quotationId) {
      setSaveMessage("احفظ المسودة أولًا قبل إرسالها للموافقة.");
      return;
    }

    if (quotationStatus !== "draft") {
      setSaveMessage("هذه المسودة تم إرسالها للموافقة بالفعل.");
      return;
    }

    const payload = buildPayload();

    if (!payload.items.length) {
      setSaveMessage("أضف بندًا واحدًا على الأقل قبل الإرسال للموافقة.");
      return;
    }

    if (payload.items.some((row) => row.quantity <= 0)) {
      setSaveMessage("كل بند يجب أن تكون كميته أكبر من صفر.");
      return;
    }

    const pricingPolicy = await runPricingRulesCheck({ silent: true });

    if (pricingPolicy?.error) {
      setSaveMessage(
        pricingPolicy.error.message ||
          "تعذر التحقق من قواعد التسعير قبل الإرسال للموافقة."
      );
      return;
    }

    if (pricingPolicy?.blocked) {
      setSaveMessage(
        "لا يمكن إرسال عرض السعر للموافقة: يوجد بند أو أكثر أقل من الحد الأدنى للهامش حسب قواعد التسعير."
      );
      return;
    }

    setSubmittingApproval(true);

    try {
      /*
       * مهم:
       * قبل تغيير الحالة إلى pending_approval نحفظ آخر تعديلات المستخدم
       * (خصوصًا الشروط التجارية وبيانات RFQ) حتى لا تضيع لو ضغط
       * "إرسال للموافقة" مباشرة بدون الضغط على "حفظ كمسودة".
       */
      const saveResponse = await fetch(
        `${API_URL}/projects/${projectId}/quotations/${quotationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const saveJson = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(
          saveJson?.message ||
            Object.values(saveJson?.errors || {})?.flat()?.[0] ||
            "تعذر حفظ آخر تعديلات عرض السعر قبل الإرسال."
        );
      }

      const response = await fetch(
        `${API_URL}/projects/${projectId}/quotations/${quotationId}/submit-for-approval`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "تعذر إرسال العرض للموافقة.");
      }

      setQuotationStatus(json?.data?.status || "pending_approval");
      setSaveMessage(
        json?.message ||
          "تم حفظ آخر التعديلات وإرسال عرض السعر للموافقة بنجاح."
      );
    } catch (error) {
      console.error("Submit quotation approval error:", error);
      setSaveMessage(error.message || "تعذر إرسال العرض للموافقة.");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const extraLabels = {
    labor: "العمالة",
    installation: "التركيب",
    freight: "الشحن والنقل",
    customs: "الجمارك",
    overhead: "المصاريف الإدارية",
    contingency: "الاحتياطي / المخاطر",
    commission: "عمولة المبيعات",
  };

  return (
    <section className="qb-page" dir="rtl">
      <style>{`
        .qb-page{color:#27304a;padding-bottom:30px}
        .qb-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:14px}
        .qb-back{border:1px solid #e5e8ef;background:#fff;border-radius:10px;padding:9px 13px;font-family:inherit;display:flex;align-items:center;gap:6px;cursor:pointer}
        .qb-kicker{color:#6757f5;font-size:10px;font-weight:800;margin-bottom:5px}.qb-head h1{margin:0;font-size:24px}.qb-head p{margin:5px 0 0;color:#9aa1b0;font-size:10px}
        .qb-actions{display:flex;gap:8px}.qb-btn{border:1px solid #e3e6ee;background:#fff;border-radius:10px;padding:9px 12px;font-family:inherit;font-weight:800;font-size:10px;display:flex;align-items:center;gap:6px;cursor:pointer}.qb-btn.primary{background:#6657f5;color:#fff;border-color:#6657f5}
        .qb-meta{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:10px;background:#fff;border:1px solid #e9ebf2;border-radius:15px;padding:14px;margin-bottom:12px}
        .qb-field label{display:block;font-size:8px;color:#999fad;margin-bottom:5px}.qb-field input,.qb-field select{width:100%;box-sizing:border-box;border:1px solid #e4e7ef;border-radius:9px;padding:9px 10px;background:#fff;font-family:inherit;font-size:10px}
        .qb-grid{display:grid;grid-template-columns:280px 1fr 300px;gap:12px}
        .qb-card{background:#fff;border:1px solid #e9ebf2;border-radius:15px;overflow:hidden}.qb-card-head{padding:13px 14px;border-bottom:1px solid #edf0f5;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:space-between}
        .qb-search{padding:10px}.qb-search-box{display:flex;align-items:center;gap:7px;border:1px solid #e5e8ef;border-radius:9px;padding:8px 9px}.qb-search-box input{border:0;outline:0;width:100%;font-family:inherit;font-size:9px}
        .qb-products{max-height:560px;overflow:auto;padding:0 10px 10px}.qb-product{width:100%;border:1px solid #edf0f4;background:#fff;border-radius:10px;padding:9px;margin-top:8px;text-align:right;font-family:inherit;cursor:pointer}.qb-product:hover{border-color:#cbc4ff;background:#fbfaff}.qb-product strong{font-size:9px;display:block}.qb-product small{font-size:7px;color:#9da3b1}.qb-product-meta{display:flex;justify-content:space-between;margin-top:6px;font-size:8px;color:#60687a}
        .qb-table-wrap{overflow:auto}.qb-table{width:100%;min-width:760px;border-collapse:collapse}.qb-table th{background:#fafbfe;padding:9px;color:#999fad;font-size:8px;text-align:right}.qb-table td{padding:9px;border-top:1px solid #f0f2f5;font-size:9px}.qb-table input{width:74px;border:1px solid #e4e7ef;border-radius:7px;padding:6px;font-family:inherit;font-size:8px}.qb-remove{border:0;background:#fff0f0;color:#dc555a;border-radius:7px;padding:6px;cursor:pointer}
        .qb-empty{padding:40px 15px;text-align:center;color:#9ba2b0;font-size:10px}
        .qb-summary{padding:13px}.qb-summary-row{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid #f0f2f5;font-size:9px}.qb-summary-row strong{color:#30384d}.qb-summary-row.grand{font-size:12px;padding-top:10px}.qb-summary-row.grand strong{color:#6557f5;font-size:15px}
        .qb-profit{margin-top:11px;border-radius:11px;padding:11px;background:#f8f7ff;border:1px solid #e2ddff}.qb-profit-title{font-size:9px;font-weight:900;margin-bottom:8px}.qb-profit-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.qb-profit-box{background:#fff;border:1px solid #eceaf8;border-radius:9px;padding:8px}.qb-profit-box span{font-size:7px;color:#9ca2b0;display:block}.qb-profit-box strong{font-size:11px;margin-top:3px;display:block}
        .qb-target{margin-top:11px}.qb-target-row{display:flex;gap:7px}.qb-target input{flex:1;border:1px solid #e4e7ef;border-radius:8px;padding:8px;font-family:inherit}.qb-target button{border:0;background:#6657f5;color:#fff;border-radius:8px;padding:8px 10px;font-family:inherit;font-weight:800;font-size:8px;cursor:pointer}
        .qb-extras{margin-top:12px}.qb-extra{display:grid;grid-template-columns:1fr 100px;align-items:center;gap:7px;padding:6px 0}.qb-extra span{font-size:8px;color:#747c8f}.qb-extra input{border:1px solid #e4e7ef;border-radius:8px;padding:7px;font-family:inherit;font-size:8px}
        .qb-commercial{background:#fff;border:1px solid #e7e9f1;border-radius:18px;padding:20px;margin-bottom:16px;box-shadow:0 8px 26px rgba(40,45,70,.035)}
        .qb-commercial-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
        .qb-commercial-head strong{font-size:15px}.qb-commercial-head span{font-size:10px;color:#9aa1b0}
        .qb-commercial-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .qb-commercial .qb-field textarea{width:100%;min-height:70px;resize:vertical;box-sizing:border-box;border:1px solid #e4e7ef;border-radius:9px;padding:9px 10px;background:#fff;font-family:inherit;font-size:10px}
        .qb-commercial .wide{grid-column:span 2}.qb-commercial .full{grid-column:1/-1}
        
        .qb-workspace-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 12px;flex-wrap:wrap}
        .qb-workspace-tools{display:flex;gap:8px;flex-wrap:wrap}
        .qb-tool-btn{border:1px solid #e3e6ef;background:#fff;border-radius:10px;padding:9px 12px;font-family:inherit;font-size:10px;font-weight:800;cursor:pointer;color:#343b50;display:inline-flex;align-items:center;gap:6px}
        .qb-tool-btn.primary-soft{background:#f5f2ff;color:#6657f5;border-color:#ded8ff}
        .qb-grid{display:block!important}
        .qb-grid>.qb-card:nth-child(2){width:100%;min-width:0}
        .qb-drawer{position:fixed;top:78px;bottom:18px;width:min(380px,92vw);background:#fff;z-index:1200;border:1px solid #e5e8ef;box-shadow:0 22px 60px rgba(29,34,55,.16);border-radius:18px;overflow:auto;transition:transform .22s ease,opacity .22s ease}
        .qb-drawer.products{right:18px;transform:translateX(115%);opacity:0;pointer-events:none}
        .qb-drawer.summary{left:18px;transform:translateX(-115%);opacity:0;pointer-events:none}
        .qb-drawer.open{transform:translateX(0);opacity:1;pointer-events:auto}
        .qb-drawer .qb-card-head{position:sticky;top:0;background:#fff;z-index:2}
        .qb-drawer-close{border:0;background:#f5f6f9;width:30px;height:30px;border-radius:9px;cursor:pointer;font-family:inherit;font-size:16px;line-height:1}
        .qb-drawer-backdrop{position:fixed;inset:0;background:rgba(18,22,35,.18);z-index:1190;backdrop-filter:blur(1px)}
        .qb-summary-strip{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:14px}
        .qb-summary-chip{background:#fff;border:1px solid #e8eaf1;border-radius:14px;padding:13px 14px;min-width:0}
        .qb-summary-chip span{display:block;font-size:9px;color:#989faf;margin-bottom:5px}
        .qb-summary-chip strong{font-size:13px;color:#232a3a;white-space:nowrap}
        .qb-summary-chip.grand{background:#6657f5;border-color:#6657f5}.qb-summary-chip.grand span,.qb-summary-chip.grand strong{color:#fff}
        .qb-table-wrap{overflow:auto;border-top:1px solid #eef0f5;max-height:66vh}
        .qb-table{min-width:1220px!important}
        .qb-rule-cell{min-width:190px}
        .qb-rule-card{border-radius:10px;padding:8px 9px;border:1px solid #e8eaf1;background:#fafbfc;min-width:170px}
        .qb-rule-card.allowed{background:#ecf9f3;border-color:#ccefe0;color:#167d5a}
        .qb-rule-card.approval{background:#fff8e9;border-color:#f5dfac;color:#a86b12}
        .qb-rule-card.blocked{background:#fff0f0;border-color:#f3cdcf;color:#c94f55}
        .qb-rule-status{font-size:8px;font-weight:900;margin-bottom:5px}
        .qb-rule-prices{font-size:7px;line-height:1.7;color:inherit}
        .qb-rule-apply{margin-top:6px;border:0;background:#6657f5;color:#fff;border-radius:7px;padding:5px 7px;font-family:inherit;font-size:7px;font-weight:900;cursor:pointer}
        @media(max-width:1100px){.qb-summary-strip{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:700px){.qb-summary-strip{grid-template-columns:1fr 1fr}.qb-drawer{top:64px;right:8px!important;left:8px!important;width:auto}}

        .qb-supplier-modal-backdrop{position:fixed;inset:0;background:rgba(23,28,44,.28);z-index:1400;display:flex;align-items:center;justify-content:center;padding:20px}
        .qb-supplier-modal{width:min(920px,96vw);max-height:82vh;overflow:auto;background:#fff;border-radius:18px;border:1px solid #e7e9f0;box-shadow:0 24px 70px rgba(20,25,40,.2)}
        .qb-supplier-modal-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid #edf0f4;position:sticky;top:0;background:#fff;z-index:2}
        .qb-supplier-table{width:100%;border-collapse:collapse}
        .qb-supplier-table th,.qb-supplier-table td{padding:12px 10px;border-bottom:1px solid #eef0f4;font-size:10px;text-align:right}
        .qb-supplier-table th{font-size:9px;color:#8f96a7;background:#fafbfc}
        .qb-supplier-best{background:#f0fbf7}
        .qb-choose-supplier{border:0;background:#6657f5;color:#fff;border-radius:8px;padding:7px 10px;font-family:inherit;font-weight:800;font-size:9px;cursor:pointer}
        .qb-badge-best{display:inline-block;background:#e6f7ef;color:#13865e;border-radius:999px;padding:3px 7px;font-size:7px;font-weight:900;margin-right:5px}
        @media(max-width:1200px){.qb-grid{grid-template-columns:240px minmax(0,1fr)}.qb-grid>.qb-card:nth-child(3){grid-column:1/-1}.qb-meta{grid-template-columns:1fr 1fr}}
        @media(max-width:760px){.qb-grid,.qb-meta,.qb-commercial-grid{grid-template-columns:1fr}.qb-commercial .wide,.qb-commercial .full{grid-column:auto}.qb-actions{flex-wrap:wrap}}
      `}</style>

      <div className="qb-head">
        <div>
          <button
            type="button"
            className="qb-back"
            onClick={() => onNavigate?.("pricing")}
          >
            <ArrowRight size={14} />
            العودة للتسعير
          </button>

          <div className="qb-kicker" style={{ marginTop: 12 }}>
            التسعير / إنشاء عرض سعر
          </div>
          <h1>Quotation Workspace</h1>
          <p>
            مساحة عمل موحدة لإنشاء وتعديل عروض الأسعار والـ BOQ ومراجعة التكلفة والربحية.
          </p>
        </div>

        <div className="qb-actions">
          <button type="button" className="qb-btn">
            <FileText size={14} />
            نسخ من عرض سابق
          </button>
          <button
            type="button"
            className="qb-btn"
            onClick={openCostingEngine}
          >
            <Calculator size={14} />
            Costing Engine
          </button>
          <button
            type="button"
            className="qb-btn"
            onClick={submitForApproval}
            disabled={
              !quotationId ||
              quotationStatus !== "draft" ||
              submittingApproval
            }
            style={{
              opacity:
                !quotationId ||
                quotationStatus !== "draft" ||
                submittingApproval
                  ? 0.55
                  : 1,
            }}
          >
            <CheckCircle2 size={14} />
            {submittingApproval
              ? "جاري الإرسال..."
              : "إرسال للموافقة"}
          </button>

          <button
            type="button"
            className="qb-btn primary"
            onClick={saveDraft}
            disabled={saving}
          >
            <Save size={14} />
            {saving ? "جاري الحفظ..." : "حفظ كمسودة"}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            marginBottom: 10,
            padding: "10px 12px",
            borderRadius: 10,
            background: saveMessage.startsWith("تم ")
              ? "#ecf9f3"
              : "#fff3f3",
            color: saveMessage.startsWith("تم ")
              ? "#16855f"
              : "#cf5157",
            fontSize: 9,
            fontWeight: 800,
          }}
        >
          {saveMessage}
        </div>
      )}

      <div
        style={{
          position: "sticky",
          top: 8,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
          padding: "10px 12px",
          background: "rgba(255,255,255,.96)",
          border: "1px solid #e8eaf1",
          borderRadius: 12,
          boxShadow: "0 6px 18px rgba(31,35,48,.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div>
          <div style={{ fontSize: 10, fontWeight: 900 }}>
            عرض السعر / BOQ
          </div>
          <div style={{ fontSize: 8, color: "#959cab", marginTop: 2 }}>
            {openingDraft
              ? "جاري فتح المسودة..."
              : quotationId
              ? quotationStatus === "pending_approval"
                ? `عرض رقم #${quotationId} - بانتظار الموافقة`
                : quotationStatus === "approved"
                ? `عرض رقم #${quotationId} - معتمد`
                : `مسودة رقم #${quotationId} - اضغط حفظ لتحديث نفس المسودة`
              : "مسودة جديدة - لم يتم الحفظ بعد"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className="qb-btn"
            onClick={() => onNavigate?.("pricing")}
          >
            العودة
          </button>

          <button
            type="button"
            className="qb-btn primary"
            onClick={saveDraft}
            disabled={saving || quotationStatus !== "draft"}
            style={{
              minWidth: 120,
              justifyContent: "center",
              opacity:
                saving || quotationStatus !== "draft" ? 0.55 : 1,
            }}
          >
            <Save size={14} />
            {saving ? "جاري الحفظ..." : "حفظ المسودة"}
          </button>
        </div>
      </div>

      <div className="qb-meta">
        <div className="qb-field">
          <label>المشروع</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">اختر المشروع...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.project_code
                  ? `${project.project_code} - `
                  : ""}
                {project.name || project.customer_name}
              </option>
            ))}
          </select>
        </div>

        <div className="qb-field">
          <label>هامش الربح المستهدف %</label>
          <input
            type="number"
            value={targetMargin}
            onChange={(e) => setTargetMargin(e.target.value)}
          />
        </div>

        <div className="qb-field">
          <label>الضريبة %</label>
          <input
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </div>

        <div className="qb-field">
          <label>خصم العرض ر.س</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
      </div>

      <div className="qb-commercial">
        <div className="qb-commercial-head">
          <div>
            <strong>بيانات وشروط عرض العميل</strong>
            <span style={{ display: "block", marginTop: 4 }}>
              هذه البيانات تظهر في النسخة الرسمية المرسلة للعميل.
            </span>
          </div>
          <FileText size={17} color="#6657f5" />
        </div>

        <div className="qb-commercial-grid">
          <div className="qb-field">
            <label>رقم طلب العميل / RFQ</label>
            <input
              value={commercialTerms.customer_rfq}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  customer_rfq: e.target.value,
                }))
              }
              placeholder="مثال: RFQ-2026-001"
            />
          </div>

          <div className="qb-field">
            <label>أعد بواسطة / Prepared By</label>
            <input
              value={commercialTerms.prepared_by}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  prepared_by: e.target.value,
                }))
              }
              placeholder="اسم مسؤول التسعير"
            />
          </div>

          <div className="qb-field">
            <label>شروط الدفع</label>
            <input
              value={commercialTerms.payment_terms}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  payment_terms: e.target.value,
                }))
              }
            />
          </div>

          <div className="qb-field">
            <label>مدة التوريد</label>
            <input
              value={commercialTerms.delivery_period}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  delivery_period: e.target.value,
                }))
              }
            />
          </div>

          <div className="qb-field">
            <label>مدة التنفيذ</label>
            <input
              value={commercialTerms.execution_period}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  execution_period: e.target.value,
                }))
              }
            />
          </div>

          <div className="qb-field">
            <label>الضمان</label>
            <input
              value={commercialTerms.warranty}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  warranty: e.target.value,
                }))
              }
            />
          </div>

          <div className="qb-field full">
            <label>شروط / ملاحظات إضافية للعميل</label>
            <textarea
              value={commercialTerms.custom_terms}
              onChange={(e) =>
                setCommercialTerms((current) => ({
                  ...current,
                  custom_terms: e.target.value,
                }))
              }
              placeholder="أي شروط إضافية خاصة بهذا العرض..."
            />
          </div>
        </div>
      </div>


      <div className="qb-workspace-toolbar">
        <div>
          <strong style={{ fontSize: 13 }}>بنود عرض السعر</strong>
          <div style={{ fontSize: 9, color: "#9aa1af", marginTop: 3 }}>
            الجدول الآن بعرض مساحة العمل بالكامل، وافتح المنتجات أو الملخص عند الحاجة.
          </div>
        </div>

        <div className="qb-workspace-tools">
          <button
            type="button"
            className="qb-tool-btn"
            onClick={() => runPricingRulesCheck()}
            disabled={pricingChecking || !items.length}
            style={{
              opacity: pricingChecking || !items.length ? 0.55 : 1,
            }}
          >
            <Sparkles size={14} />
            {pricingChecking ? "جاري الفحص..." : "فحص قواعد التسعير"}
          </button>

          <button
            type="button"
            className="qb-tool-btn"
            onClick={openCostingEngine}
            disabled={!items.length}
            style={{
              opacity: !items.length ? 0.55 : 1,
            }}
          >
            <BadgeDollarSign size={14} />
            حساب التكلفة
          </button>

          <button
            type="button"
            className="qb-tool-btn primary-soft"
            onClick={() => setProductsOpen(true)}
          >
            <Package size={14} />
            المنتجات
          </button>

          <button
            type="button"
            className="qb-tool-btn"
            onClick={() => setSummaryOpen(true)}
          >
            <Calculator size={14} />
            ملخص التسعير
          </button>
        </div>
      </div>

      {(productsOpen || summaryOpen) && (
        <div
          className="qb-drawer-backdrop"
          onClick={() => {
            setProductsOpen(false);
            setSummaryOpen(false);
          }}
        />
      )}

      <div className="qb-grid">
        <div className={`qb-card qb-drawer products ${productsOpen ? "open" : ""}`}>
          <div className="qb-card-head">
            <span>المنتجات</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} />
              <button
                type="button"
                className="qb-drawer-close"
                onClick={() => setProductsOpen(false)}
                aria-label="إغلاق المنتجات"
              >
                ×
              </button>
            </div>
          </div>

          <div className="qb-search">
            <div className="qb-search-box">
              <Search size={14} />
              <input
                placeholder="ابحث باسم المنتج أو SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="qb-products">
            {loading ? (
              <div className="qb-empty">جاري تحميل المنتجات...</div>
            ) : filteredProducts.length ? (
              filteredProducts.map((product) => (
                <button
                  type="button"
                  className="qb-product"
                  key={product.id}
                  onClick={() => addProduct(product)}
                >
                  <strong>{product.name}</strong>
                  <small>
                    {product.sku || "بدون SKU"} ·{" "}
                    {product.brand || "بدون علامة"}
                  </small>
                  <div className="qb-product-meta">
                    <span>تكلفة {money(product.cost_price)} ر.س</span>
                    <span>
                      بيع {money(product.default_sale_price)} ر.س
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="qb-empty">لا توجد منتجات مطابقة.</div>
            )}
          </div>
        </div>

        <div className="qb-card">
          <div className="qb-card-head">
            <span>بنود العرض / Excel BOQ</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="qb-btn"
                onClick={addCustomRow}
              >
                <Plus size={13} />
                إضافة صف حر
              </button>
              <Boxes size={16} />
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              background: "#fbfbfe",
              borderBottom: "1px solid #edf0f5",
              fontSize: 8,
              color: "#858c9d",
            }}
          >
            اكتب أي منتج أو خدمة مباشرة حتى لو غير موجودة بالمخزون،
            أو اختر منتجًا من القائمة الجانبية. يمكنك أيضًا نسخ صفوف من Excel
            ولصقها مباشرة هنا: الكود، الوصف، الوحدة، القسم، الكمية، التكلفة،
            سعر البيع، الخصم. واضغط Enter للانتقال للصف التالي أو إنشاء صف جديد.
          </div>

          <div className="qb-table-wrap">
            <table className="qb-table" style={{ minWidth: 1420 }}>
              <thead>
                <tr>
                  <th style={{ width: 34 }}>#</th>
                  <th>الكود</th>
                  <th style={{ minWidth: 190 }}>المنتج / الوصف</th>
                  <th>الوحدة</th>
                  <th>القسم</th>
                  <th>الكمية</th>
                  <th>التكلفة</th>
                  <th>سعر البيع</th>
                  <th>خصم</th>
                  <th>الإجمالي</th>
                  <th>الربح</th>
                  <th>Margin</th>
                  <th className="qb-rule-cell">قاعدة التسعير</th>
                  <th></th>
                </tr>
              </thead>

              <tbody onPaste={handlePasteRows}>
                {items.map((item, index) => {
                  const rowKey =
                    item.row_id || `product-${item.product_id}`;
                  const lineCost =
                    Number(item.qty || 0) * Number(item.cost || 0);
                  const grossSale =
                    Number(item.qty || 0) * Number(item.sale || 0);
                  const rowDiscount = Math.min(
                    grossSale,
                    Number(item.discount || 0)
                  );
                  const lineSale = Math.max(
                    0,
                    grossSale - rowDiscount
                  );
                  const lineProfit = lineSale - lineCost;
                  const lineMargin =
                    lineSale > 0
                      ? (lineProfit / lineSale) * 100
                      : 0;
                  const pricingCheck = pricingChecks[rowKey];

                  return (
                    <tr key={rowKey}>
                      <td>{index + 1}</td>

                      <td>
                        <input
                          value={item.sku || ""}
                          data-boq-row={index}
                          data-boq-field="sku"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "sku")}
                          placeholder="SKU"
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "sku",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          value={item.name || ""}
                          data-boq-row={index}
                          data-boq-field="name"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "name")}
                          placeholder="اكتب اسم المنتج أو الخدمة..."
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "name",
                              e.target.value
                            )
                          }
                          style={{ width: 180 }}
                        />
                        <div
                          style={{
                            fontSize: 7,
                            color: item.is_custom
                              ? "#e2903e"
                              : "#7d72ee",
                            marginTop: 3,
                          }}
                        >
                          {item.is_custom
                            ? "بند حر"
                            : `من المخزون · متاح ${item.stock ?? 0}`}
                        </div>
                        {!item.is_custom && item.supplier_name && (
                          <div
                            style={{
                              fontSize: 7,
                              color: "#16855f",
                              marginTop: 3,
                              fontWeight: 800,
                            }}
                          >
                            المورد: {item.supplier_name} · تكلفة معتمدة{" "}
                            {money(item.supplier_cost_snapshot ?? item.cost)} ر.س
                          </div>
                        )}
                      </td>

                      <td>
                        <input
                          value={item.unit || ""}
                          data-boq-row={index}
                          data-boq-field="unit"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "unit")}
                          placeholder="قطعة"
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "unit",
                              e.target.value
                            )
                          }
                          style={{ width: 65 }}
                        />
                      </td>

                      <td>
                        <input
                          value={item.section || "عام"}
                          data-boq-row={index}
                          data-boq-field="section"
                          onKeyDown={(e) =>
                            handleCellKeyDown(e, index, "section")
                          }
                          placeholder="CCTV"
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "section",
                              e.target.value
                            )
                          }
                          style={{ width: 75 }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          data-boq-row={index}
                          data-boq-field="qty"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "qty")}
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "qty",
                              e.target.value
                            )
                          }
                          style={{ width: 58 }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.cost}
                          dir="ltr"
                          data-boq-row={index}
                          data-boq-field="cost"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "cost")}
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "cost",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.sale}
                          dir="ltr"
                          data-boq-row={index}
                          data-boq-field="sale"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "sale")}
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "sale",
                              e.target.value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.discount || 0}
                          data-boq-row={index}
                          data-boq-field="discount"
                          onKeyDown={(e) => handleCellKeyDown(e, index, "discount")}
                          onChange={(e) =>
                            updateRow(
                              rowKey,
                              "discount",
                              e.target.value
                            )
                          }
                          style={{ width: 65 }}
                        />
                      </td>

                      <td style={{ fontWeight: 900 }}>
                        {money(lineSale)}
                      </td>

                      <td>{money(lineProfit)}</td>

                      <td
                        style={{
                          color:
                            lineMargin >= targetMargin
                              ? "#169a6a"
                              : "#e05b60",
                          fontWeight: 900,
                        }}
                      >
                        {lineMargin.toFixed(1)}%
                      </td>

                      <td className="qb-rule-cell">
                        {pricingCheck ? (
                          <div
                            className={`qb-rule-card ${pricingCheck.status || "allowed"}`}
                          >
                            <div className="qb-rule-status">
                              {pricingCheck.status === "blocked"
                                ? "مرفوض - أقل من الحد الأدنى"
                                : pricingCheck.status === "approval"
                                ? "يحتاج موافقة"
                                : "مسموح"}
                            </div>

                            <div className="qb-rule-prices">
                              <div>
                                Minimum: {money(pricingCheck.minimum_price)} ر.س
                              </div>
                              <div>
                                Target: {money(pricingCheck.target_price)} ر.س
                              </div>
                              <div>
                                Recommended:{" "}
                                <strong>
                                  {money(pricingCheck.recommended_price)} ر.س
                                </strong>
                              </div>
                            </div>

                            {Number(pricingCheck.recommended_price || 0) > 0 && (
                              <button
                                type="button"
                                className="qb-rule-apply"
                                onClick={() => applyRecommendedPrice(rowKey)}
                              >
                                تطبيق السعر المقترح
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: "#a1a7b4", fontSize: 8 }}>
                            اضغط فحص قواعد التسعير
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {!item.is_custom && item.product_id && (
                            <button
                              type="button"
                              className="qb-remove"
                              title="بدائل المنتج"
                              onClick={() => openProductAlternatives(rowKey)}
                              style={{
                                background: "#f2f0ff",
                                color: "#6757f5",
                              }}
                            >
                              <Boxes size={12} />
                            </button>
                          )}

                          {!item.is_custom && item.product_id && (
                            <button
                              type="button"
                              className="qb-remove"
                              title="أسعار الموردين"
                              onClick={() => openSupplierPrices(rowKey)}
                              style={{
                                background: "#edf8f5",
                                color: "#16855f",
                              }}
                            >
                              <Truck size={12} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="qb-remove"
                            title="نسخ الصف"
                            onClick={() => duplicateRow(rowKey)}
                            style={{
                              background: "#f2f0ff",
                              color: "#6757f5",
                            }}
                          >
                            <Plus size={12} />
                          </button>

                          <button
                            type="button"
                            className="qb-remove"
                            title="حذف الصف"
                            onClick={() => removeRow(rowKey)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                <tr>
                  <td colSpan="14" style={{ padding: 8 }}>
                    <button
                      type="button"
                      onClick={addCustomRow}
                      style={{
                        width: "100%",
                        border: "1px dashed #cfc9ff",
                        background: "#fbfaff",
                        color: "#6757f5",
                        borderRadius: 8,
                        padding: 9,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 800,
                        fontSize: 9,
                      }}
                    >
                      + إضافة صف جديد مثل Excel
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {!items.length && (
            <div className="qb-empty">
              <Plus size={22} />
              <div style={{ marginTop: 8 }}>
                اضغط "إضافة صف حر" واكتب البند بنفسك، أو اختر منتجًا
                من القائمة.
              </div>
            </div>
          )}
        </div>

        <div className={`qb-card qb-drawer summary ${summaryOpen ? "open" : ""}`}>
          <div className="qb-card-head">
            <span>ملخص التسعير</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calculator size={16} />
              <button
                type="button"
                className="qb-drawer-close"
                onClick={() => setSummaryOpen(false)}
                aria-label="إغلاق ملخص التسعير"
              >
                ×
              </button>
            </div>
          </div>

          <div className="qb-summary">
            <div className="qb-summary-row">
              <span>تكلفة المنتجات</span>
              <strong>{money(totals.itemsCost)} ر.س</strong>
            </div>

            <div className="qb-summary-row">
              <span>التكاليف الإضافية</span>
              <strong>{money(totals.extras)} ر.س</strong>
            </div>

            <div className="qb-summary-row">
              <span>إجمالي التكلفة</span>
              <strong>{money(totals.totalCost)} ر.س</strong>
            </div>

            <div className="qb-summary-row">
              <span>قيمة البيع قبل الخصم</span>
              <strong>{money(totals.itemsSale)} ر.س</strong>
            </div>

            <div className="qb-summary-row">
              <span>الخصم</span>
              <strong>{money(totals.discountAmount)} ر.س</strong>
            </div>

            <div className="qb-summary-row">
              <span>قبل الضريبة</span>
              <strong>{money(totals.netBeforeTax)} ر.س</strong>
            </div>

            <div className="qb-summary-row">
              <span>الضريبة</span>
              <strong>{money(totals.tax)} ر.س</strong>
            </div>

            <div className="qb-summary-row grand">
              <span>الإجمالي النهائي</span>
              <strong>{money(totals.grandTotal)} ر.س</strong>
            </div>

            <div className="qb-profit">
              <div className="qb-profit-title">
                <BadgeDollarSign
                  size={14}
                  style={{
                    verticalAlign: "middle",
                    marginLeft: 5,
                  }}
                />
                تحليل الربحية
              </div>

              <div className="qb-profit-grid">
                <div className="qb-profit-box">
                  <span>الربح</span>
                  <strong>{money(totals.profit)} ر.س</strong>
                </div>

                <div className="qb-profit-box">
                  <span>Margin</span>
                  <strong>{totals.margin.toFixed(1)}%</strong>
                </div>

                <div className="qb-profit-box">
                  <span>Markup</span>
                  <strong>{totals.markup.toFixed(1)}%</strong>
                </div>

                <div className="qb-profit-box">
                  <span>سعر Target</span>
                  <strong>{money(totals.targetSale)} ر.س</strong>
                </div>
              </div>

              <div className="qb-target">
                <div className="qb-target-row">
                  <input
                    type="number"
                    value={targetMargin}
                    onChange={(e) =>
                      setTargetMargin(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={applyTargetMargin}
                  >
                    <Sparkles size={12} />
                    تطبيق الهامش
                  </button>
                </div>
              </div>
            </div>

            <div className="qb-extras">
              <div className="pricing-title">
                التكاليف الإضافية
              </div>

              {Object.keys(extraCosts).map((key) => (
                <div className="qb-extra" key={key}>
                  <span>{extraLabels[key]}</span>
                  <input
                    type="number"
                    value={extraCosts[key]}
                    onChange={(e) =>
                      setExtraCosts((current) => ({
                        ...current,
                        [key]: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 10,
                background:
                  totals.margin >= Number(targetMargin)
                    ? "#ecf9f3"
                    : "#fff2f2",
                color:
                  totals.margin >= Number(targetMargin)
                    ? "#178b62"
                    : "#d45156",
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              {totals.margin >= Number(targetMargin) ? (
                <>
                  <CheckCircle2
                    size={13}
                    style={{
                      verticalAlign: "middle",
                      marginLeft: 4,
                    }}
                  />
                  الهامش الحالي يحقق الهدف.
                </>
              ) : (
                <>
                  <Sparkles
                    size={13}
                    style={{
                      verticalAlign: "middle",
                      marginLeft: 4,
                    }}
                  />
                  الهامش أقل من الهدف المحدد.
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {alternativeModalRow && (
        <div
          className="qb-supplier-modal-backdrop"
          onClick={() => setAlternativeModalRow(null)}
        >
          <div
            className="qb-supplier-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qb-supplier-modal-head">
              <div>
                <strong style={{ fontSize: 14 }}>بدائل المنتج</strong>
                <div style={{ fontSize: 9, color: "#98a0af", marginTop: 3 }}>
                  اختر البديل الأنسب وسيتم استبدال نفس سطر الـ BOQ مع الحفاظ على الكمية والقسم والخصم.
                </div>
              </div>
              <button
                type="button"
                className="qb-drawer-close"
                onClick={() => setAlternativeModalRow(null)}
              >
                <X size={15} />
              </button>
            </div>

            {alternativesLoading ? (
              <div className="qb-empty">جاري تحميل بدائل المنتج...</div>
            ) : alternativesError ? (
              <div className="qb-empty" style={{ color: "#cf5157" }}>
                {alternativesError}
              </div>
            ) : alternativeRows.length ? (
              <div>
                {alternativeRows.map((altRow) => {
                  const product = altRow.alternative_product || {};
                  const comparison = altRow.comparison || {};
                  const best = comparison.best_supplier_price;
                  const fastest = comparison.fastest_supplier_price;
                  return (
                    <div key={altRow.id} style={{ padding: "14px 16px", borderBottom: "1px solid #eef0f4" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: 12 }}>{product.name || "منتج بديل"}</strong>
                          <div style={{ fontSize: 8, color: "#9299a8", marginTop: 4 }}>
                            {product.sku || "بدون SKU"} · {product.brand || "بدون علامة"} · {product.model || "بدون موديل"}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 8, color: "#6657f5", fontWeight: 800 }}>
                            {altRow.is_preferred ? "★ البديل المفضل" : `الأولوية ${altRow.priority || 100}`}
                          </div>
                        </div>
                        <button type="button" className="qb-choose-supplier" onClick={() => chooseProductAlternative(altRow)}>
                          استبدال بهذا المنتج
                        </button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 7, marginTop: 12 }}>
                        {[
                          ["أفضل تكلفة", money(comparison.best_cost)],
                          ["سعر البيع", money(comparison.default_sale_price)],
                          ["الهامش", comparison.margin_percent == null ? "—" : `${comparison.margin_percent}%`],
                          ["المخزون", Number(comparison.stock_quantity || 0)],
                          ["مدة التوريد", fastest?.lead_time_days != null ? `${fastest.lead_time_days} يوم` : "—"],
                        ].map(([label, value]) => (
                          <div key={label} style={{ background: "#fafbfc", border: "1px solid #eef0f4", borderRadius: 9, padding: 8 }}>
                            <span style={{ display: "block", fontSize: 7, color: "#969dab", marginBottom: 4 }}>{label}</span>
                            <strong style={{ fontSize: 9 }}>{value}</strong>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: 8, color: "#73798a", marginTop: 9 }}>
                        أفضل مورد: <strong>{best?.supplier?.name || "غير محدد"}</strong>
                        {altRow.reason ? ` · السبب: ${altRow.reason}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="qb-empty">
                لا توجد بدائل نشطة لهذا المنتج. أضف البدائل أولًا من شاشة بدائل المنتجات.
              </div>
            )}
          </div>
        </div>
      )}

      {supplierModalRow && (
        <div
          className="qb-supplier-modal-backdrop"
          onClick={() => setSupplierModalRow(null)}
        >
          <div
            className="qb-supplier-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="qb-supplier-modal-head">
              <div>
                <strong style={{ fontSize: 14 }}>أسعار الموردين</strong>
                <div style={{ fontSize: 9, color: "#98a0af", marginTop: 3 }}>
                  اختر المورد الذي تريد اعتماد تكلفته داخل عرض السعر.
                </div>
              </div>
              <button
                type="button"
                className="qb-drawer-close"
                onClick={() => setSupplierModalRow(null)}
              >
                ×
              </button>
            </div>

            <div style={{ padding: 14 }}>
              {supplierPricesLoading ? (
                <div className="qb-empty">جاري تحميل أسعار الموردين...</div>
              ) : supplierPricesError ? (
                <div className="qb-empty" style={{ color: "#cf5157" }}>
                  {supplierPricesError}
                </div>
              ) : supplierPrices.length ? (
                <table className="qb-supplier-table">
                  <thead>
                    <tr>
                      <th>المورد</th>
                      <th>السعر</th>
                      <th>مدة التوريد</th>
                      <th>الحد الأدنى</th>
                      <th>صالح حتى</th>
                      <th>الحالة</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierPrices.map((priceRow, index) => {
                      const isBest =
                        supplierPrices
                          .filter((p) => p.is_valid !== false)
                          .reduce(
                            (best, p) =>
                              !best ||
                              Number(p.unit_price || 0) <
                                Number(best.unit_price || 0)
                                ? p
                                : best,
                            null
                          )?.id === priceRow.id;

                      return (
                        <tr
                          key={priceRow.id}
                          className={isBest ? "qb-supplier-best" : ""}
                        >
                          <td>
                            <strong>
                              {priceRow.supplier?.name || "مورد"}
                            </strong>
                            {priceRow.is_preferred && (
                              <span className="qb-badge-best">مفضل</span>
                            )}
                            {isBest && (
                              <span className="qb-badge-best">أفضل سعر</span>
                            )}
                          </td>
                          <td>
                            <strong>{money(priceRow.unit_price)} ر.س</strong>
                          </td>
                          <td>
                            {priceRow.lead_time_days !== null &&
                            priceRow.lead_time_days !== undefined
                              ? `${priceRow.lead_time_days} يوم`
                              : "—"}
                          </td>
                          <td>
                            {priceRow.minimum_order_quantity || 1}
                          </td>
                          <td>{priceRow.valid_until || "—"}</td>
                          <td>
                            {priceRow.is_valid === false ? (
                              <span style={{ color: "#d4565c" }}>منتهي</span>
                            ) : (
                              <span style={{ color: "#16855f" }}>ساري</span>
                            )}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="qb-choose-supplier"
                              disabled={priceRow.is_valid === false}
                              style={{
                                opacity: priceRow.is_valid === false ? 0.45 : 1,
                              }}
                              onClick={() => chooseSupplierPrice(priceRow)}
                            >
                              اختيار
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="qb-empty">
                  لا توجد أسعار موردين مرتبطة بهذا المنتج حتى الآن.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="qb-summary-strip">
        <div className="qb-summary-chip">
          <span>إجمالي التكلفة</span>
          <strong>{money(totals.totalCost)} ر.س</strong>
        </div>
        <div className="qb-summary-chip">
          <span>قبل الضريبة</span>
          <strong>{money(totals.netBeforeTax)} ر.س</strong>
        </div>
        <div className="qb-summary-chip">
          <span>الضريبة</span>
          <strong>{money(totals.tax)} ر.س</strong>
        </div>
        <div className="qb-summary-chip">
          <span>الربح</span>
          <strong>{money(totals.profit)} ر.س</strong>
        </div>
        <div className="qb-summary-chip">
          <span>هامش الربح</span>
          <strong>{totals.margin.toFixed(1)}%</strong>
        </div>
        <div className="qb-summary-chip grand">
          <span>الإجمالي النهائي</span>
          <strong>{money(totals.grandTotal)} ر.س</strong>
        </div>
      </div>
    </section>
  );
}
