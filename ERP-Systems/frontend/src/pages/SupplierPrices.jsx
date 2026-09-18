import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  RefreshCcw,
  PackageSearch,
  Truck,
  BadgeDollarSign,
  CalendarDays,
  Pencil,
  X,
  CheckCircle2,
  Clock3,
  Boxes,
  Users,
  Upload,
  ImagePlus,
  Scale,
  Trophy,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000/api";
const BACKEND_URL = "http://127.0.0.1:8000";

const emptyForm = {
  // supplier-price fields already used by the current page
  product_id: "",
  supplier_id: "",
  unit_price: "",
  currency: "SAR",
  minimum_order_quantity: 1,
  lead_time_days: "",
  valid_from: "",
  valid_until: "",
  payment_terms: "",
  warranty_terms: "",
  notes: "",
  is_preferred: false,
  is_active: true,

  // new: create a product from the same supplier-price window
  product_mode: "existing",
  new_product_name: "",
  new_product_sku: "",
  new_product_category: "",
  new_product_brand: "",
  new_product_model: "",
  new_product_description: "",
  new_product_unit: "قطعة",
  new_product_barcode: "",
  new_product_sale_price: "",
  new_product_tax_rate: "15",
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const dateText = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toLocaleDateString("en-CA");
};

const productImageUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  return `${BACKEND_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

export default function SupplierPrices({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("prices");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // new product image - only used when "إنشاء منتج جديد" is selected
  const [newProductImage, setNewProductImage] = useState(null);
  const [newProductImagePreview, setNewProductImagePreview] = useState("");

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [pricesRes, productsRes, suppliersRes] = await Promise.all([
        fetch(`${API_URL}/supplier-prices`, {
          headers: { Accept: "application/json" },
        }),
        fetch(`${API_URL}/products`, {
          headers: { Accept: "application/json" },
        }),
        fetch(`${API_URL}/suppliers`, {
          headers: { Accept: "application/json" },
        }),
      ]);

      const [pricesJson, productsJson, suppliersJson] = await Promise.all([
        pricesRes.json(),
        productsRes.json(),
        suppliersRes.json(),
      ]);

      if (!pricesRes.ok || !pricesJson?.success) {
        throw new Error(pricesJson?.message || "تعذر تحميل أسعار الموردين.");
      }

      if (!productsRes.ok || !productsJson?.success) {
        throw new Error(productsJson?.message || "تعذر تحميل المنتجات.");
      }

      if (!suppliersRes.ok || !suppliersJson?.success) {
        throw new Error(suppliersJson?.message || "تعذر تحميل الموردين.");
      }

      setRows(Array.isArray(pricesJson.data) ? pricesJson.data : []);
      setProducts(Array.isArray(productsJson.data) ? productsJson.data : []);
      setSuppliers(Array.isArray(suppliersJson.data) ? suppliersJson.data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "حدث خطأ أثناء تحميل البيانات.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    return () => {
      if (newProductImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(newProductImagePreview);
      }
    };
  }, [newProductImagePreview]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter(Boolean)
          .map(String)
      )
    ).sort();
  }, [products]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((row) => {
      const product = row.product || {};
      const supplier = row.supplier || {};

      const matchesSearch =
        !q ||
        [
          product.name,
          product.sku,
          product.model,
          product.brand,
          supplier.name,
          supplier.code,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));

      const matchesSupplier =
        supplierFilter === "all" ||
        String(row.supplier_id) === String(supplierFilter);

      const matchesCategory =
        categoryFilter === "all" ||
        String(product.category || "") === String(categoryFilter);

      const isExpired =
        row.is_valid === false ||
        (row.valid_until &&
          new Date(row.valid_until).setHours(23, 59, 59, 999) <
            Date.now());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "valid" && !isExpired) ||
        (statusFilter === "expired" && isExpired) ||
        (statusFilter === "preferred" && row.is_preferred);

      return (
        matchesSearch &&
        matchesSupplier &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [rows, search, supplierFilter, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const valid = rows.filter((r) => r.is_valid !== false).length;
    const preferred = rows.filter((r) => r.is_preferred).length;
    const productsWithPrices = new Set(rows.map((r) => r.product_id)).size;
    const suppliersUsed = new Set(rows.map((r) => r.supplier_id)).size;

    return {
      total: rows.length,
      valid,
      preferred,
      productsWithPrices,
      suppliersUsed,
    };
  }, [rows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewProductImage(null);
    setNewProductImagePreview("");
    setMessage("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      ...emptyForm,
      product_mode: "existing",
      product_id: row.product_id ? String(row.product_id) : "",
      supplier_id: row.supplier_id ? String(row.supplier_id) : "",
      unit_price: row.unit_price ?? "",
      currency: row.currency || "SAR",
      minimum_order_quantity: row.minimum_order_quantity ?? 1,
      lead_time_days: row.lead_time_days ?? "",
      valid_from: row.valid_from ? String(row.valid_from).slice(0, 10) : "",
      valid_until: row.valid_until ? String(row.valid_until).slice(0, 10) : "",
      payment_terms: row.payment_terms || "",
      warranty_terms: row.warranty_terms || "",
      notes: row.notes || "",
      is_preferred: Boolean(row.is_preferred),
      is_active: row.is_active !== false,
    });
    setNewProductImage(null);
    setNewProductImagePreview("");
    setMessage("");
    setModalOpen(true);
  };

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleNewProductImage = (file) => {
    if (newProductImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(newProductImagePreview);
    }

    if (!file) {
      setNewProductImage(null);
      setNewProductImagePreview("");
      return;
    }

    setNewProductImage(file);
    setNewProductImagePreview(URL.createObjectURL(file));
  };

  const createProductFromSupplierPrice = async () => {
    if (!form.new_product_name.trim() || !form.new_product_sku.trim()) {
      throw new Error("اسم المنتج و SKU مطلوبان لإنشاء المنتج الجديد.");
    }

    const productData = new FormData();

    productData.append("name", form.new_product_name.trim());
    productData.append("sku", form.new_product_sku.trim());
    productData.append("category", form.new_product_category || "");
    productData.append("brand", form.new_product_brand || "");
    productData.append("model", form.new_product_model || "");
    productData.append("description", form.new_product_description || "");
    productData.append("unit", form.new_product_unit || "قطعة");
    productData.append("barcode", form.new_product_barcode || "");

    // Supplier unit price is the first known cost for this newly created product.
    productData.append("cost_price", String(Number(form.unit_price || 0)));
    productData.append(
      "default_sale_price",
      String(Number(form.new_product_sale_price || 0))
    );
    productData.append(
      "tax_rate",
      String(Number(form.new_product_tax_rate || 0))
    );

    productData.append("opening_stock", "0");
    productData.append("minimum_stock", "0");
    productData.append("is_active", "1");

    if (newProductImage) {
      productData.append("image", newProductImage);
    }

    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: productData,
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      const firstValidationError = json?.errors
        ? Object.values(json.errors)?.[0]?.[0]
        : null;

      throw new Error(
        firstValidationError ||
          json?.message ||
          "تعذر إنشاء المنتج الجديد."
      );
    }

    return json.data;
  };

  const submitForm = async (event) => {
    event.preventDefault();

    if (!form.supplier_id || form.unit_price === "") {
      setMessage("اختر المورد وأدخل سعر الوحدة.");
      return;
    }

    if (
      !editingId &&
      form.product_mode === "new" &&
      (!form.new_product_name.trim() || !form.new_product_sku.trim())
    ) {
      setMessage("اسم المنتج و SKU مطلوبان للمنتج الجديد.");
      return;
    }

    if (
      (editingId || form.product_mode === "existing") &&
      !form.product_id
    ) {
      setMessage("اختر المنتج.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      let productId = form.product_id;

      // Only create a product on a NEW supplier-price record.
      if (!editingId && form.product_mode === "new") {
        const createdProduct = await createProductFromSupplierPrice();
        productId = createdProduct.id;
      }

      const payload = {
        product_id: Number(productId),
        supplier_id: Number(form.supplier_id),
        unit_price: Number(form.unit_price),
        currency: form.currency || "SAR",
        minimum_order_quantity: Number(form.minimum_order_quantity || 1),
        lead_time_days:
          form.lead_time_days === "" ? null : Number(form.lead_time_days),
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        payment_terms: form.payment_terms || null,
        warranty_terms: form.warranty_terms || null,
        notes: form.notes || null,
        is_preferred: Boolean(form.is_preferred),
        is_active: Boolean(form.is_active),
      };

      const url = editingId
        ? `${API_URL}/supplier-prices/${editingId}`
        : `${API_URL}/supplier-prices`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json?.success) {
        const firstValidationError = json?.errors
          ? Object.values(json.errors)?.[0]?.[0]
          : null;

        throw new Error(
          firstValidationError ||
            json?.message ||
            "تعذر حفظ سعر المورد."
        );
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      setNewProductImage(null);
      setNewProductImagePreview("");
      await loadAll();
    } catch (err) {
      console.error(err);
      setMessage(err.message || "تعذر حفظ البيانات.");
    } finally {
      setSaving(false);
    }
  };


  const comparisonRows = useMemo(() => {
    const grouped = new Map();

    rows.forEach((row) => {
      const product = row.product || {};
      const productId = row.product_id || product.id;

      if (!productId) return;

      if (!grouped.has(productId)) {
        grouped.set(productId, {
          product_id: productId,
          product,
          offers: [],
        });
      }

      grouped.get(productId).offers.push(row);
    });

    return Array.from(grouped.values())
      .map((group) => {
        const activeOffers = group.offers
          .filter((offer) => offer.is_active !== false)
          .sort(
            (a, b) =>
              Number(a.unit_price || 0) - Number(b.unit_price || 0)
          );

        const bestPriceOffer = activeOffers[0] || null;

        const fastestOffer =
          [...activeOffers]
            .filter(
              (offer) =>
                offer.lead_time_days !== null &&
                offer.lead_time_days !== undefined
            )
            .sort(
              (a, b) =>
                Number(a.lead_time_days || 0) -
                Number(b.lead_time_days || 0)
            )[0] || null;

        return {
          ...group,
          activeOffers,
          bestPriceOffer,
          fastestOffer,
        };
      })
      .filter((group) => {
        const q = search.trim().toLowerCase();

        const matchesSearch =
          !q ||
          [
            group.product?.name,
            group.product?.sku,
            group.product?.brand,
            group.product?.model,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value).toLowerCase().includes(q)
            );

        const matchesCategory =
          categoryFilter === "all" ||
          String(group.product?.category || "") ===
            String(categoryFilter);

        const matchesSupplier =
          supplierFilter === "all" ||
          group.activeOffers.some(
            (offer) =>
              String(offer.supplier_id) === String(supplierFilter)
          );

        return matchesSearch && matchesCategory && matchesSupplier;
      })
      .sort((a, b) =>
        String(a.product?.name || "").localeCompare(
          String(b.product?.name || ""),
          "ar"
        )
      );
  }, [rows, search, categoryFilter, supplierFilter]);


  const useSupplierInBoq = (product, offer) => {
    const payload = {
      product_id: product?.id || offer?.product_id || null,
      supplier_id: offer?.supplier_id || null,
      supplier_price_id: offer?.id || null,
      supplier_name: offer?.supplier?.name || "مورد",
      supplier_cost_snapshot: Number(offer?.unit_price || 0),
      supplier_lead_time_snapshot:
        offer?.lead_time_days !== null &&
        offer?.lead_time_days !== undefined
          ? Number(offer.lead_time_days)
          : null,
      supplier_valid_until_snapshot: offer?.valid_until || null,
    };

    sessionStorage.setItem(
      "masa_supplier_to_boq",
      JSON.stringify(payload)
    );

    onNavigate?.("pricing-builder");
  };

  const selectedProduct = products.find(
    (p) => String(p.id) === String(form.product_id)
  );

  const selectedProductImage = productImageUrl(selectedProduct?.image_path);

  return (
    <section className="sp-page" dir="rtl">
      <style>{`
        .sp-page{
          color:#242a3a;
          font-family:inherit;
          padding-bottom:30px;
        }

        .sp-head{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:16px;
          margin-bottom:18px;
        }

        .sp-kicker{
          font-size:10px;
          font-weight:900;
          color:#6b5cf6;
          margin-bottom:5px;
        }

        .sp-head h1{
          margin:0;
          font-size:24px;
          line-height:1.2;
        }

        .sp-head p{
          margin:7px 0 0;
          color:#959cac;
          font-size:11px;
        }

        .sp-primary{
          border:0;
          background:#6757f6;
          color:#fff;
          border-radius:11px;
          min-height:38px;
          padding:0 14px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:7px;
          cursor:pointer;
          font-family:inherit;
          font-weight:900;
          font-size:10px;
          box-shadow:0 8px 20px rgba(103,87,246,.18);
        }

        .sp-secondary{
          border:1px solid #e2e5ed;
          background:#fff;
          color:#4d5569;
          border-radius:10px;
          min-height:36px;
          padding:0 12px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:6px;
          cursor:pointer;
          font-family:inherit;
          font-weight:800;
          font-size:9px;
        }

        .sp-stat-grid{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:12px;
          margin-bottom:14px;
        }

        .sp-stat{
          background:#fff;
          border:1px solid #e9ebf2;
          border-radius:15px;
          padding:14px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          min-height:74px;
        }

        .sp-stat small{
          color:#9ba2b1;
          font-size:8px;
          font-weight:800;
          display:block;
          margin-bottom:6px;
        }

        .sp-stat strong{
          font-size:19px;
          line-height:1;
        }

        .sp-stat-icon{
          width:36px;
          height:36px;
          border-radius:11px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f2f0ff;
          color:#6757f6;
        }

        .sp-stat:nth-child(2) .sp-stat-icon{
          background:#edf9f4;
          color:#1b9a70;
        }

        .sp-stat:nth-child(3) .sp-stat-icon{
          background:#fff6e8;
          color:#d78a23;
        }

        .sp-stat:nth-child(4) .sp-stat-icon{
          background:#eef6ff;
          color:#367bd7;
        }

        .sp-card{
          background:#fff;
          border:1px solid #e9ebf2;
          border-radius:16px;
          overflow:hidden;
        }

        .sp-toolbar{
          padding:13px;
          display:grid;
          grid-template-columns:minmax(260px,1.6fr) repeat(3,minmax(150px,.7fr)) auto;
          gap:9px;
          border-bottom:1px solid #edf0f5;
          align-items:center;
        }

        .sp-field{
          position:relative;
        }

        .sp-field svg{
          position:absolute;
          right:11px;
          top:50%;
          transform:translateY(-50%);
          color:#9aa1b2;
          pointer-events:none;
        }

        .sp-input,
        .sp-select{
          width:100%;
          min-height:36px;
          border:1px solid #e4e7ef;
          border-radius:9px;
          background:#fff;
          font-family:inherit;
          font-size:9px;
          color:#3e4658;
          outline:none;
          padding:0 11px;
          box-sizing:border-box;
        }

        .sp-field .sp-input{
          padding-right:34px;
        }

        .sp-input:focus,
        .sp-select:focus{
          border-color:#b8b0ff;
          box-shadow:0 0 0 3px rgba(103,87,246,.07);
        }

        .sp-table-wrap{
          overflow:auto;
        }

        .sp-table{
          width:100%;
          border-collapse:collapse;
          min-width:980px;
        }

        .sp-table th{
          background:#fafbfc;
          color:#8e95a7;
          font-size:8px;
          font-weight:900;
          padding:11px 10px;
          text-align:right;
          border-bottom:1px solid #e9ecf2;
          white-space:nowrap;
        }

        .sp-table td{
          padding:12px 10px;
          border-bottom:1px solid #eef0f4;
          font-size:9px;
          vertical-align:middle;
        }

        .sp-product{
          display:flex;
          align-items:center;
          gap:9px;
          min-width:180px;
        }

        .sp-product-image{
          width:38px;
          height:38px;
          border-radius:10px;
          border:1px solid #eceef4;
          background:#f8f9fb;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          flex:0 0 auto;
        }

        .sp-product-image img{
          width:100%;
          height:100%;
          object-fit:contain;
        }

        .sp-product strong{
          display:block;
          font-size:9px;
          margin-bottom:3px;
        }

        .sp-product small{
          color:#a0a6b4;
          font-size:7px;
        }

        .sp-supplier strong{
          display:block;
          margin-bottom:3px;
        }

        .sp-supplier small{
          color:#a1a7b5;
          font-size:7px;
        }

        .sp-price{
          font-weight:900;
          font-size:10px;
          color:#2d3345;
          white-space:nowrap;
        }

        .sp-badge{
          display:inline-flex;
          align-items:center;
          gap:4px;
          border-radius:999px;
          padding:4px 7px;
          font-size:7px;
          font-weight:900;
          white-space:nowrap;
        }

        .sp-badge.valid{
          background:#eaf8f2;
          color:#15825e;
        }

        .sp-badge.expired{
          background:#fff0f0;
          color:#cc555b;
        }

        .sp-badge.preferred{
          background:#fff7e8;
          color:#bc7717;
          margin-right:4px;
        }

        .sp-icon-btn{
          width:29px;
          height:29px;
          border:1px solid #e5e8ef;
          background:#fff;
          border-radius:8px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          color:#657086;
          cursor:pointer;
        }

        .sp-empty{
          padding:38px 20px;
          text-align:center;
          color:#999fac;
          font-size:10px;
        }

        .sp-message{
          margin:0 0 12px;
          border:1px solid #f0d7d8;
          background:#fff7f7;
          color:#b84f55;
          border-radius:10px;
          padding:9px 11px;
          font-size:9px;
          font-weight:700;
        }

        .sp-modal-backdrop{
          position:fixed;
          inset:0;
          z-index:1600;
          background:rgba(26,31,45,.28);
          display:flex;
          align-items:center;
          justify-content:center;
          padding:18px;
        }

        .sp-modal{
          width:min(820px,96vw);
          max-height:90vh;
          overflow:auto;
          background:#fff;
          border:1px solid #e7e9ef;
          border-radius:18px;
          box-shadow:0 28px 80px rgba(25,30,45,.22);
        }

        .sp-modal-head{
          position:sticky;
          top:0;
          z-index:3;
          background:#fff;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          padding:15px 18px;
          border-bottom:1px solid #edf0f4;
        }

        .sp-modal-head h3{
          margin:0;
          font-size:14px;
        }

        .sp-modal-head p{
          margin:4px 0 0;
          font-size:8px;
          color:#9ba1af;
        }

        .sp-close{
          width:32px;
          height:32px;
          border:1px solid #e5e8ef;
          background:#fff;
          border-radius:9px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#687084;
        }

        .sp-form{
          padding:16px 18px 18px;
        }


        .sp-mode-tabs{
          display:flex;
          gap:8px;
          margin-bottom:14px;
        }

        .sp-mode-tab{
          flex:1;
          min-height:42px;
          border:1px solid #e4e7ef;
          background:#fafbfc;
          color:#687084;
          border-radius:11px;
          cursor:pointer;
          font-family:inherit;
          font-size:9px;
          font-weight:900;
        }

        .sp-mode-tab.active{
          background:#f2f0ff;
          border-color:#bcb5ff;
          color:#6354f5;
        }

        .sp-new-product-panel{
          grid-column:1/-1;
          border:1px solid #e8eaf1;
          background:#fbfbfd;
          border-radius:14px;
          padding:14px;
        }

        .sp-new-product-title{
          display:flex;
          align-items:center;
          gap:7px;
          margin-bottom:12px;
          font-size:10px;
          font-weight:900;
          color:#3e4658;
        }

        .sp-upload-box{
          position:relative;
          min-height:125px;
          border:1px dashed #c8c2ff;
          background:#f8f7ff;
          border-radius:12px;
          display:flex;
          align-items:center;
          justify-content:center;
          overflow:hidden;
          cursor:pointer;
        }

        .sp-upload-box input{
          position:absolute;
          inset:0;
          opacity:0;
          cursor:pointer;
        }

        .sp-upload-box img{
          width:100%;
          height:125px;
          object-fit:contain;
          background:#fff;
        }

        .sp-upload-placeholder{
          text-align:center;
          color:#7467f6;
        }

        .sp-upload-placeholder small{
          display:block;
          margin-top:5px;
          color:#9ba1af;
          font-size:7px;
        }

        .sp-form-grid{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:11px;
        }

        .sp-form-group label{
          display:block;
          font-size:8px;
          color:#737b8e;
          font-weight:900;
          margin-bottom:5px;
        }

        .sp-form-group.full{
          grid-column:1/-1;
        }

        .sp-textarea{
          width:100%;
          min-height:70px;
          border:1px solid #e4e7ef;
          border-radius:10px;
          padding:10px;
          resize:vertical;
          box-sizing:border-box;
          font-family:inherit;
          font-size:9px;
          outline:none;
        }

        .sp-product-preview{
          border:1px solid #eceef4;
          background:#fafbfc;
          border-radius:11px;
          padding:10px;
          display:flex;
          align-items:center;
          gap:9px;
          margin-top:7px;
        }

        .sp-product-preview strong{
          font-size:9px;
        }

        .sp-product-preview small{
          display:block;
          color:#a0a6b4;
          font-size:7px;
          margin-top:3px;
        }

        .sp-checks{
          display:flex;
          align-items:center;
          gap:16px;
          margin-top:5px;
        }

        .sp-check{
          display:flex;
          align-items:center;
          gap:6px;
          font-size:8px;
          color:#596174;
          font-weight:800;
        }

        .sp-form-actions{
          display:flex;
          justify-content:flex-start;
          gap:8px;
          border-top:1px solid #edf0f4;
          margin-top:16px;
          padding-top:14px;
        }


        .sp-page-tabs{
          display:flex;
          gap:8px;
          margin-bottom:14px;
          background:#fff;
          border:1px solid #e9ebf2;
          border-radius:14px;
          padding:6px;
          width:max-content;
          max-width:100%;
        }

        .sp-page-tab{
          border:0;
          background:transparent;
          color:#7d8495;
          padding:9px 14px;
          border-radius:10px;
          font-family:inherit;
          font-size:9px;
          font-weight:900;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          gap:6px;
        }

        .sp-page-tab.active{
          background:#f0edff;
          color:#6657f5;
        }

        .sp-compare-list{
          display:grid;
          gap:12px;
        }

        .sp-compare-card{
          background:#fff;
          border:1px solid #e9ebf2;
          border-radius:16px;
          overflow:hidden;
        }

        .sp-compare-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          padding:14px 16px;
          border-bottom:1px solid #eef0f4;
        }

        .sp-compare-product{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .sp-compare-product strong{
          display:block;
          font-size:10px;
          margin-bottom:3px;
        }

        .sp-compare-product small{
          color:#9da4b2;
          font-size:7px;
        }

        .sp-compare-summary{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
          justify-content:flex-end;
        }

        .sp-compare-summary span{
          display:inline-flex;
          align-items:center;
          gap:5px;
          border-radius:999px;
          padding:6px 9px;
          font-size:7px;
          font-weight:900;
          white-space:nowrap;
        }

        .sp-compare-summary .best{
          background:#eaf8f2;
          color:#16845f;
        }

        .sp-compare-summary .fast{
          background:#eef5ff;
          color:#3d72c9;
        }

        .sp-offers-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(210px,1fr));
          gap:10px;
          padding:14px;
        }

        .sp-offer{
          position:relative;
          border:1px solid #e8ebf1;
          border-radius:13px;
          padding:12px;
          background:#fff;
        }

        .sp-offer.best{
          border-color:#a9e0cd;
          background:#f8fdfa;
        }

        .sp-offer.preferred{
          box-shadow:inset 0 0 0 1px #e6cb91;
        }

        .sp-offer-top{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:8px;
          margin-bottom:10px;
        }

        .sp-offer-supplier strong{
          display:block;
          font-size:9px;
        }

        .sp-offer-supplier small{
          display:block;
          margin-top:3px;
          color:#a0a6b4;
          font-size:7px;
        }

        .sp-offer-price{
          font-size:15px;
          font-weight:900;
          color:#20283b;
          margin-bottom:8px;
        }

        .sp-offer-meta{
          display:grid;
          gap:6px;
          font-size:8px;
          color:#687084;
        }

        .sp-offer-meta div{
          display:flex;
          justify-content:space-between;
          gap:8px;
        }

        .sp-use-boq{
          width:100%;
          margin-top:11px;
          min-height:34px;
          border:0;
          border-radius:9px;
          background:#6657f5;
          color:#fff;
          font-family:inherit;
          font-size:8px;
          font-weight:900;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:6px;
        }

        .sp-use-boq:hover{
          background:#5949ef;
        }

        .sp-offer-badge{
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:4px 6px;
          border-radius:999px;
          font-size:7px;
          font-weight:900;
        }

        .sp-offer-badge.best{
          background:#e5f7ef;
          color:#16845f;
        }

        .sp-offer-badge.preferred{
          background:#fff5de;
          color:#ba771f;
        }

        .sp-compare-empty{
          background:#fff;
          border:1px dashed #dfe3eb;
          border-radius:14px;
          padding:34px;
          text-align:center;
          color:#9aa1af;
          font-size:9px;
        }

        @media(max-width:1100px){
          .sp-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .sp-toolbar{grid-template-columns:1fr 1fr}
          .sp-toolbar .sp-search-box{grid-column:1/-1}
        }

        @media(max-width:700px){
          .sp-head{flex-direction:column}
          .sp-stat-grid{grid-template-columns:1fr}
          .sp-toolbar{grid-template-columns:1fr}
          .sp-toolbar .sp-search-box{grid-column:auto}
          .sp-form-grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="sp-head">
        <div>
          <div className="sp-kicker">الموردين / مركز التسعير</div>
          <h1>أسعار الموردين</h1>
          <p>
            إدارة تكلفة المنتجات من مختلف الموردين وربطها مباشرة بعروض الأسعار.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="sp-secondary"
            onClick={() => onNavigate?.("pricing")}
          >
            العودة لمركز التسعير
          </button>

          <button type="button" className="sp-primary" onClick={openCreate}>
            <Plus size={15} />
            إضافة سعر مورد
          </button>
        </div>
      </div>

      {error && <div className="sp-message">{error}</div>}

      <div className="sp-page-tabs">
        <button
          type="button"
          className={`sp-page-tab ${
            activeTab === "prices" ? "active" : ""
          }`}
          onClick={() => setActiveTab("prices")}
        >
          <BadgeDollarSign size={13} />
          قائمة أسعار الموردين
        </button>

        <button
          type="button"
          className={`sp-page-tab ${
            activeTab === "compare" ? "active" : ""
          }`}
          onClick={() => setActiveTab("compare")}
        >
          <Scale size={13} />
          مقارنة الموردين
        </button>
      </div>


      {activeTab === "prices" && (
        <>
      <div className="sp-stat-grid">
        <div className="sp-stat">
          <div>
            <small>إجمالي أسعار الموردين</small>
            <strong>{stats.total}</strong>
          </div>
          <span className="sp-stat-icon">
            <BadgeDollarSign size={18} />
          </span>
        </div>

        <div className="sp-stat">
          <div>
            <small>الأسعار السارية</small>
            <strong>{stats.valid}</strong>
          </div>
          <span className="sp-stat-icon">
            <CheckCircle2 size={18} />
          </span>
        </div>

        <div className="sp-stat">
          <div>
            <small>منتجات لها أسعار</small>
            <strong>{stats.productsWithPrices}</strong>
          </div>
          <span className="sp-stat-icon">
            <Boxes size={18} />
          </span>
        </div>

        <div className="sp-stat">
          <div>
            <small>موردون مستخدمون</small>
            <strong>{stats.suppliersUsed}</strong>
          </div>
          <span className="sp-stat-icon">
            <Users size={18} />
          </span>
        </div>
      </div>

      <div className="sp-card">
        <div className="sp-toolbar">
          <div className="sp-field sp-search-box">
            <Search size={14} />
            <input
              className="sp-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن منتج، SKU، مورد، موديل..."
            />
          </div>

          <select
            className="sp-select"
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          >
            <option value="all">كل الموردين</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>

          <select
            className="sp-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">كل الفئات</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="sp-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">كل الحالات</option>
            <option value="valid">ساري</option>
            <option value="expired">منتهي</option>
            <option value="preferred">مورد مفضل</option>
          </select>

          <button type="button" className="sp-secondary" onClick={loadAll}>
            <RefreshCcw size={13} />
            تحديث
          </button>
        </div>

        <div className="sp-table-wrap">
          {loading ? (
            <div className="sp-empty">جاري تحميل أسعار الموردين...</div>
          ) : filteredRows.length ? (
            <table className="sp-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المنتج</th>
                  <th>المورد</th>
                  <th>سعر الوحدة</th>
                  <th>الحد الأدنى</th>
                  <th>مدة التوريد</th>
                  <th>آخر تحديث</th>
                  <th>صلاحية السعر</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, index) => {
                  const expired =
                    row.is_valid === false ||
                    (row.valid_until &&
                      new Date(row.valid_until).setHours(23, 59, 59, 999) <
                        Date.now());

                  return (
                    <tr key={row.id}>
                      <td>{index + 1}</td>

                      <td>
                        <div className="sp-product">
                          <div className="sp-product-image">
                            {row.product?.image_path ? (
                              <img
                                src={productImageUrl(row.product.image_path)}
                                alt={row.product?.name || ""}
                              />
                            ) : (
                              <PackageSearch size={17} color="#9aa1b2" />
                            )}
                          </div>

                          <div>
                            <strong>{row.product?.name || "—"}</strong>
                            <small>
                              {row.product?.sku || "بدون SKU"}
                              {row.product?.brand
                                ? ` · ${row.product.brand}`
                                : ""}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="sp-supplier">
                          <strong>{row.supplier?.name || "—"}</strong>
                          <small>
                            {row.supplier?.code ||
                              row.supplier?.phone ||
                              "مورد"}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span className="sp-price">
                          {money(row.unit_price)} ر.س
                        </span>
                      </td>

                      <td>{row.minimum_order_quantity || 1}</td>

                      <td>
                        {row.lead_time_days !== null &&
                        row.lead_time_days !== undefined
                          ? `${row.lead_time_days} يوم`
                          : "—"}
                      </td>

                      <td>{dateText(row.updated_at)}</td>

                      <td>{dateText(row.valid_until)}</td>

                      <td>
                        <span
                          className={`sp-badge ${
                            expired ? "expired" : "valid"
                          }`}
                        >
                          {expired ? (
                            <Clock3 size={10} />
                          ) : (
                            <CheckCircle2 size={10} />
                          )}
                          {expired ? "منتهي" : "ساري"}
                        </span>

                        {row.is_preferred && (
                          <span className="sp-badge preferred">مفضل</span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="sp-icon-btn"
                          title="تعديل السعر"
                          onClick={() => openEdit(row)}
                        >
                          <Pencil size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="sp-empty">
              لا توجد أسعار مطابقة للفلاتر الحالية.
            </div>
          )}
        </div>
      </div>

        </>
      )}


      {activeTab === "compare" && (
        <div className="sp-compare-list">
          {comparisonRows.length ? (
            comparisonRows.map((group) => {
              const product = group.product || {};
              const best = group.bestPriceOffer;
              const fastest = group.fastestOffer;

              return (
                <div
                  className="sp-compare-card"
                  key={`compare-${group.product_id}`}
                >
                  <div className="sp-compare-head">
                    <div className="sp-compare-product">
                      <div className="sp-product-image">
                        {product?.image_path ? (
                          <img
                            src={productImageUrl(product.image_path)}
                            alt={product?.name || ""}
                          />
                        ) : (
                          <PackageSearch size={17} color="#9aa1b2" />
                        )}
                      </div>

                      <div>
                        <strong>{product?.name || "منتج"}</strong>
                        <small>
                          {product?.sku || "بدون SKU"}
                          {product?.brand ? ` · ${product.brand}` : ""}
                          {product?.model ? ` · ${product.model}` : ""}
                        </small>
                      </div>
                    </div>

                    <div className="sp-compare-summary">
                      {best && (
                        <span className="best">
                          <Trophy size={11} />
                          أفضل سعر: {money(best.unit_price)} ر.س
                        </span>
                      )}

                      {fastest && (
                        <span className="fast">
                          <Clock3 size={11} />
                          أسرع توريد: {fastest.lead_time_days} يوم
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="sp-offers-grid">
                    {group.activeOffers.map((offer) => {
                      const isBest =
                        best && Number(best.id) === Number(offer.id);

                      return (
                        <div
                          key={offer.id}
                          className={`sp-offer ${
                            isBest ? "best" : ""
                          } ${offer.is_preferred ? "preferred" : ""}`}
                        >
                          <div className="sp-offer-top">
                            <div className="sp-offer-supplier">
                              <strong>
                                {offer.supplier?.name || "مورد"}
                              </strong>
                              <small>
                                {offer.supplier?.code ||
                                  offer.supplier?.phone ||
                                  "Supplier"}
                              </small>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                gap: 4,
                                flexWrap: "wrap",
                              }}
                            >
                              {isBest && (
                                <span className="sp-offer-badge best">
                                  الأفضل
                                </span>
                              )}

                              {offer.is_preferred && (
                                <span className="sp-offer-badge preferred">
                                  مفضل
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="sp-offer-price">
                            {money(offer.unit_price)} ر.س
                          </div>

                          <div className="sp-offer-meta">
                            <div>
                              <span>مدة التوريد</span>
                              <strong>
                                {offer.lead_time_days !== null &&
                                offer.lead_time_days !== undefined
                                  ? `${offer.lead_time_days} يوم`
                                  : "—"}
                              </strong>
                            </div>

                            <div>
                              <span>الحد الأدنى</span>
                              <strong>
                                {offer.minimum_order_quantity || 1}
                              </strong>
                            </div>

                            <div>
                              <span>صلاحية السعر</span>
                              <strong>
                                {dateText(offer.valid_until)}
                              </strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="sp-use-boq"
                            onClick={() => useSupplierInBoq(product, offer)}
                          >
                            <Truck size={12} />
                            استخدام هذا المورد في BOQ
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="sp-compare-empty">
              لا توجد بيانات كافية للمقارنة حتى الآن.
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <div
          className="sp-modal-backdrop"
          onClick={() => setModalOpen(false)}
        >
          <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sp-modal-head">
              <div>
                <h3>
                  {editingId ? "تعديل سعر المورد" : "إضافة سعر مورد جديد"}
                </h3>
                <p>
                  السعر المحفوظ هنا سيظهر مباشرة داخل مقارنة الموردين في
                  الـBOQ.
                </p>
              </div>

              <button
                type="button"
                className="sp-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            <form className="sp-form" onSubmit={submitForm}>
              {message && <div className="sp-message">{message}</div>}

              {!editingId && (
                <div className="sp-mode-tabs">
                  <button
                    type="button"
                    className={`sp-mode-tab ${
                      form.product_mode === "existing" ? "active" : ""
                    }`}
                    onClick={() => setField("product_mode", "existing")}
                  >
                    منتج موجود
                  </button>

                  <button
                    type="button"
                    className={`sp-mode-tab ${
                      form.product_mode === "new" ? "active" : ""
                    }`}
                    onClick={() => setField("product_mode", "new")}
                  >
                    + إنشاء منتج جديد
                  </button>
                </div>
              )}

              <div className="sp-form-grid">
                {(editingId || form.product_mode === "existing") && (
                  <div className="sp-form-group">
                    <label>المنتج *</label>
                    <select
                      className="sp-select"
                      value={form.product_id}
                      disabled={Boolean(editingId)}
                      onChange={(e) => setField("product_id", e.target.value)}
                    >
                      <option value="">اختر المنتج</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                          {product.sku ? ` - ${product.sku}` : ""}
                        </option>
                      ))}
                    </select>

                    {selectedProduct && (
                      <div className="sp-product-preview">
                        <div className="sp-product-image">
                          {selectedProductImage ? (
                            <img
                              src={selectedProductImage}
                              alt={selectedProduct.name}
                            />
                          ) : (
                            <PackageSearch size={17} color="#8e95a8" />
                          )}
                        </div>
                        <div>
                          <strong>{selectedProduct.name}</strong>
                          <small>
                            {selectedProduct.sku || "بدون SKU"}
                            {selectedProduct.category
                              ? ` · ${selectedProduct.category}`
                              : ""}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!editingId && form.product_mode === "new" && (
                  <div className="sp-new-product-panel">
                    <div className="sp-new-product-title">
                      <ImagePlus size={15} color="#6757f6" />
                      بيانات المنتج الجديد
                    </div>

                    <div className="sp-form-grid">
                      <div className="sp-form-group">
                        <label>صورة المنتج</label>
                        <label className="sp-upload-box">
                          {newProductImagePreview ? (
                            <img
                              src={newProductImagePreview}
                              alt="معاينة المنتج"
                            />
                          ) : (
                            <div className="sp-upload-placeholder">
                              <Upload size={22} />
                              <div>اضغط لاختيار صورة</div>
                              <small>JPG / PNG / WEBP - حتى 5MB</small>
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) =>
                              handleNewProductImage(
                                e.target.files?.[0] || null
                              )
                            }
                          />
                        </label>
                      </div>

                      <div className="sp-form-group">
                        <label>اسم المنتج *</label>
                        <input
                          className="sp-input"
                          value={form.new_product_name}
                          onChange={(e) =>
                            setField("new_product_name", e.target.value)
                          }
                          placeholder="مثال: Hikvision 8MP Camera"
                        />

                        <label style={{ marginTop: 10 }}>
                          SKU / Part Number *
                        </label>
                        <input
                          className="sp-input"
                          value={form.new_product_sku}
                          onChange={(e) =>
                            setField("new_product_sku", e.target.value)
                          }
                          placeholder="CAM-8MP-001"
                        />
                      </div>

                      <div className="sp-form-group">
                        <label>الماركة</label>
                        <input
                          className="sp-input"
                          value={form.new_product_brand}
                          onChange={(e) =>
                            setField("new_product_brand", e.target.value)
                          }
                          placeholder="Hikvision"
                        />
                      </div>

                      <div className="sp-form-group">
                        <label>الموديل</label>
                        <input
                          className="sp-input"
                          value={form.new_product_model}
                          onChange={(e) =>
                            setField("new_product_model", e.target.value)
                          }
                          placeholder="DS-2CD..."
                        />
                      </div>

                      <div className="sp-form-group">
                        <label>التصنيف</label>
                        <input
                          className="sp-input"
                          value={form.new_product_category}
                          onChange={(e) =>
                            setField("new_product_category", e.target.value)
                          }
                          placeholder="كاميرات مراقبة"
                        />
                      </div>

                      <div className="sp-form-group">
                        <label>الوحدة</label>
                        <select
                          className="sp-select"
                          value={form.new_product_unit}
                          onChange={(e) =>
                            setField("new_product_unit", e.target.value)
                          }
                        >
                          <option value="قطعة">قطعة</option>
                          <option value="جهاز">جهاز</option>
                          <option value="طقم">طقم</option>
                          <option value="متر">متر</option>
                          <option value="لفة">لفة</option>
                          <option value="علبة">علبة</option>
                        </select>
                      </div>

                      <div className="sp-form-group">
                        <label>سعر البيع الافتراضي</label>
                        <input
                          className="sp-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.new_product_sale_price}
                          onChange={(e) =>
                            setField(
                              "new_product_sale_price",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="sp-form-group">
                        <label>الضريبة %</label>
                        <input
                          className="sp-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.new_product_tax_rate}
                          onChange={(e) =>
                            setField(
                              "new_product_tax_rate",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="sp-form-group">
                        <label>Barcode</label>
                        <input
                          className="sp-input"
                          value={form.new_product_barcode}
                          onChange={(e) =>
                            setField("new_product_barcode", e.target.value)
                          }
                          placeholder="اختياري"
                        />
                      </div>

                      <div className="sp-form-group full">
                        <label>وصف المنتج</label>
                        <textarea
                          className="sp-textarea"
                          value={form.new_product_description}
                          onChange={(e) =>
                            setField(
                              "new_product_description",
                              e.target.value
                            )
                          }
                          placeholder="المواصفات أو وصف مختصر للمنتج..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="sp-form-group">
                  <label>المورد *</label>
                  <select
                    className="sp-select"
                    value={form.supplier_id}
                    disabled={Boolean(editingId)}
                    onChange={(e) => setField("supplier_id", e.target.value)}
                  >
                    <option value="">اختر المورد</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sp-form-group">
                  <label>سعر الوحدة *</label>
                  <input
                    className="sp-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) => setField("unit_price", e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="sp-form-group">
                  <label>العملة</label>
                  <select
                    className="sp-select"
                    value={form.currency}
                    onChange={(e) => setField("currency", e.target.value)}
                  >
                    <option value="SAR">SAR - ريال سعودي</option>
                    <option value="USD">USD - دولار</option>
                    <option value="AED">AED - درهم</option>
                  </select>
                </div>

                <div className="sp-form-group">
                  <label>الحد الأدنى للطلب</label>
                  <input
                    className="sp-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.minimum_order_quantity}
                    onChange={(e) =>
                      setField("minimum_order_quantity", e.target.value)
                    }
                  />
                </div>

                <div className="sp-form-group">
                  <label>مدة التوريد بالأيام</label>
                  <input
                    className="sp-input"
                    type="number"
                    min="0"
                    step="1"
                    value={form.lead_time_days}
                    onChange={(e) =>
                      setField("lead_time_days", e.target.value)
                    }
                    placeholder="مثال: 5"
                  />
                </div>

                <div className="sp-form-group">
                  <label>ساري من</label>
                  <input
                    className="sp-input"
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setField("valid_from", e.target.value)}
                  />
                </div>

                <div className="sp-form-group">
                  <label>ساري حتى</label>
                  <input
                    className="sp-input"
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setField("valid_until", e.target.value)}
                  />
                </div>

                <div className="sp-form-group full">
                  <label>شروط الدفع</label>
                  <input
                    className="sp-input"
                    value={form.payment_terms}
                    onChange={(e) =>
                      setField("payment_terms", e.target.value)
                    }
                    placeholder="مثال: 30% مقدم - 70% عند التوريد"
                  />
                </div>

                <div className="sp-form-group full">
                  <label>شروط الضمان</label>
                  <input
                    className="sp-input"
                    value={form.warranty_terms}
                    onChange={(e) =>
                      setField("warranty_terms", e.target.value)
                    }
                    placeholder="مثال: سنة ضد عيوب الصناعة"
                  />
                </div>

                <div className="sp-form-group full">
                  <label>ملاحظات</label>
                  <textarea
                    className="sp-textarea"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="أي تفاصيل إضافية خاصة بهذا السعر..."
                  />
                </div>

                <div className="sp-form-group full">
                  <div className="sp-checks">
                    <label className="sp-check">
                      <input
                        type="checkbox"
                        checked={form.is_preferred}
                        onChange={(e) =>
                          setField("is_preferred", e.target.checked)
                        }
                      />
                      المورد المفضل لهذا المنتج
                    </label>

                    <label className="sp-check">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) =>
                          setField("is_active", e.target.checked)
                        }
                      />
                      السعر نشط
                    </label>
                  </div>
                </div>
              </div>

              <div className="sp-form-actions">
                <button type="submit" className="sp-primary" disabled={saving}>
                  {saving
                    ? "جاري الحفظ..."
                    : editingId
                    ? "حفظ التعديلات"
                    : form.product_mode === "new"
                    ? "إنشاء المنتج وإضافة السعر"
                    : "إضافة السعر"}
                </button>

                <button
                  type="button"
                  className="sp-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
