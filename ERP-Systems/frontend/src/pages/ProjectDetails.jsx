import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  UserRound,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  FileText,
  ShoppingCart,
  WalletCards,
  FolderOpen,
  Users,
  CheckCircle2,
  Clock3,
  Send,
  Undo2,
  Edit3,
  Printer,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  ReceiptText,
  Boxes,
  ArrowUpFromLine,
  TrendingUp,
  Trash2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Activity,
} from "lucide-react";

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/

const API_URL = "http://127.0.0.1:8000/api";

/*
|--------------------------------------------------------------------------
| Workflow
|--------------------------------------------------------------------------
*/

const workflowStages = [
  {
    key: "crm",
    name: "CRM",
  },
  {
    key: "sales",
    name: "المبيعات",
  },
  {
    key: "pricing",
    name: "التسعير",
  },
  {
    key: "purchasing",
    name: "المشتريات",
  },
  {
    key: "finance",
    name: "المالية",
  },
  {
    key: "execution",
    name: "التنفيذ",
  },
  {
    key: "closed",
    name: "الإغلاق",
  },
];

const stageNames = {
  crm: "CRM",
  sales: "المبيعات",
  pricing: "التسعير",
  purchasing: "المشتريات",
  finance: "المالية",
  execution: "التنفيذ",
  closed: "الإغلاق",
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const formatMoney = (value) => {
  const number = Number(value || 0);

  return `${number.toLocaleString("en-US")} ر.س`;
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-CA");
};

const getInitials = (name = "") => {
  const words = name.trim().split(" ").filter(Boolean);

  if (!words.length) {
    return "MA";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function ProjectDetails({
  projectId = 1,
  onBack,
  onOpenPurchases,
  onNavigate,
}) {
  const [project, setProject] = useState(null);

  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState("");

  const [isMoving, setIsMoving] = useState(false);

  const [moveMessage, setMoveMessage] = useState("");

  const [moveError, setMoveError] = useState("");

  const [isReturning, setIsReturning] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnError, setReturnError] = useState("");

  const [isCreatingPurchaseOrder, setIsCreatingPurchaseOrder] =
    useState(false);

  const [purchaseOrderMessage, setPurchaseOrderMessage] =
    useState("");

  const [purchaseOrderError, setPurchaseOrderError] =
    useState("");

  const [quotationProducts, setQuotationProducts] = useState([]);
  const [quotationBusy, setQuotationBusy] = useState(false);
  const [quotationError, setQuotationError] = useState("");
  const [quotationMessage, setQuotationMessage] = useState("");
  const [quotationEditorOpen, setQuotationEditorOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [quotationForm, setQuotationForm] = useState({
    discount: "0",
    valid_until: "",
    notes: "",
    items: [
      {
        product_id: "",
        product_name: "",
        sku: "",
        description: "",
        quantity: "1",
        cost_price: "0",
        unit_price: "0",
        discount: "0",
        tax_rate: "15",
      },
    ],
  });


  const [projectMaterials, setProjectMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  const [projectExpenses, setProjectExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesError, setExpensesError] = useState("");
  const [expenseMessage, setExpenseMessage] = useState("");
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    category: "labor",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  const [executionBusy, setExecutionBusy] = useState(false);
  const [executionMessage, setExecutionMessage] = useState("");
  const [executionError, setExecutionError] = useState("");
  const [executionStatus, setExecutionStatus] = useState("in_progress");
  const [executionReason, setExecutionReason] = useState("");
  const [returnTargetStage, setReturnTargetStage] = useState("pricing");

  const executionStatuses = [
    { value: "in_progress", label: "جاري التنفيذ" },
    { value: "site_preparation", label: "تجهيز الموقع" },
    { value: "installation", label: "تركيب" },
    { value: "testing", label: "اختبار وتشغيل" },
    { value: "waiting_customer", label: "بانتظار العميل" },
    { value: "waiting_materials", label: "بانتظار مواد" },
    { value: "waiting_approval", label: "بانتظار اعتماد" },
  ];

  const executionStageOptions = [
    { value: "sales", label: "المبيعات" },
    { value: "pricing", label: "التسعير" },
    { value: "purchasing", label: "المشتريات" },
    { value: "finance", label: "المالية" },
  ];

  const executionStatusLabel = (value) =>
    executionStatuses.find((item) => item.value === value)?.label ||
    (value === "on_hold" ? "متوقف" : value || "غير محددة");

  const callExecutionApi = async (path, method = "POST", body = {}) => {
    if (!project) return;

    try {
      setExecutionBusy(true);
      setExecutionMessage("");
      setExecutionError("");

      const response = await fetch(
        `${API_URL}/projects/${project.id}/${path}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ||
            result.message ||
            "تعذر تنفيذ العملية المطلوبة"
        );
      }

      setExecutionMessage(result.message || "تم تنفيذ العملية بنجاح.");
      setExecutionReason("");
      await loadProject();
    } catch (error) {
      console.error("Execution action error:", error);
      setExecutionError(
        error.message || "حدث خطأ أثناء تحديث حالة التنفيذ"
      );
    } finally {
      setExecutionBusy(false);
    }
  };

  const handleUpdateExecutionStatus = async () => {
    if (!executionStatus) {
      setExecutionError("اختر حالة التنفيذ أولاً.");
      return;
    }

    await callExecutionApi("execution-status", "PUT", {
      execution_status: executionStatus,
      notes: executionReason.trim() || null,
    });
  };

  const handleHoldExecution = async () => {
    if (!executionReason.trim()) {
      setExecutionError("اكتب سبب إيقاف المشروع.");
      return;
    }

    await callExecutionApi("hold-execution", "POST", {
      reason: executionReason.trim(),
      notes: executionReason.trim(),
    });
  };

  const handleResumeExecution = async () => {
    await callExecutionApi("resume-execution", "POST", {
      notes: executionReason.trim() || "تم استئناف تنفيذ المشروع",
    });
  };

  const handleReturnToStage = async () => {
    if (!executionReason.trim()) {
      setExecutionError("سبب إرجاع المشروع للقسم مطلوب.");
      return;
    }

    await callExecutionApi("return-to-stage", "POST", {
      target_stage: returnTargetStage,
      reason: executionReason.trim(),
    });
  };


  /*
  |--------------------------------------------------------------------------
  | Quotation Management
  |--------------------------------------------------------------------------
  */

  const blankQuotationItem = () => ({
    product_id: "",
    product_name: "",
    sku: "",
    description: "",
    quantity: "1",
    cost_price: "0",
    unit_price: "0",
    discount: "0",
    tax_rate: "15",
  });

  const loadQuotationProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`, {
        headers: { Accept: "application/json" },
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "تعذر تحميل المنتجات");
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.products)
          ? result.products
          : [];

      setQuotationProducts(rows);
    } catch (error) {
      console.error("Quotation products error:", error);
      setQuotationError(error.message || "تعذر تحميل المنتجات");
    }
  };

  const openCreateQuotation = async () => {
    setQuotationError("");
    setQuotationMessage("");
    setEditingQuotation(null);
    setQuotationForm({
      discount: "0",
      valid_until: "",
      notes: "",
      items: [blankQuotationItem()],
    });

    if (!quotationProducts.length) {
      await loadQuotationProducts();
    }

    setQuotationEditorOpen(true);
  };

  const openEditQuotation = async (quotationRow) => {
    setQuotationError("");
    setQuotationMessage("");
    setEditingQuotation(quotationRow);

    setQuotationForm({
      discount: String(quotationRow?.discount ?? 0),
      valid_until: quotationRow?.valid_until
        ? String(quotationRow.valid_until).slice(0, 10)
        : "",
      notes: quotationRow?.notes || "",
      items: (quotationRow?.items || []).length
        ? quotationRow.items.map((item) => ({
            product_id: item.product_id || "",
            product_name: item.product_name || item.product?.name || "",
            sku: item.sku || item.product?.sku || "",
            description: item.description || "",
            quantity: String(item.quantity ?? 1),
            cost_price: String(item.cost_price ?? 0),
            unit_price: String(item.unit_price ?? 0),
            discount: String(item.discount ?? 0),
            tax_rate: String(item.tax_rate ?? 15),
          }))
        : [blankQuotationItem()],
    });

    if (!quotationProducts.length) {
      await loadQuotationProducts();
    }

    setQuotationEditorOpen(true);
  };

  const closeQuotationEditor = () => {
    if (quotationBusy) return;
    setQuotationEditorOpen(false);
    setEditingQuotation(null);
    setQuotationError("");
  };

  const updateQuotationItem = (index, field, value) => {
    setQuotationForm((current) => {
      const items = current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const next = { ...item, [field]: value };

        if (field === "product_id") {
          const product = quotationProducts.find(
            (row) => String(row.id) === String(value)
          );

          if (product) {
            next.product_id = product.id;
            next.product_name = product.name || "";
            next.sku = product.sku || "";
            next.description = product.description || "";
            next.cost_price = String(product.cost_price ?? 0);
            next.unit_price = String(
              product.default_sale_price ??
                product.sale_price ??
                product.cost_price ??
                0
            );
            next.tax_rate = String(product.tax_rate ?? 15);
          } else {
            next.product_id = "";
          }
        }

        return next;
      });

      return { ...current, items };
    });
  };

  const addQuotationItem = () => {
    setQuotationForm((current) => ({
      ...current,
      items: [...current.items, blankQuotationItem()],
    }));
  };

  const removeQuotationItem = (index) => {
    setQuotationForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const quotationPreview = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let cost = 0;

    quotationForm.items.forEach((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unit_price || 0);
      const lineDiscount = Number(item.discount || 0);
      const taxRate = Number(item.tax_rate || 0);
      const costPrice = Number(item.cost_price || 0);

      const lineSubtotal = Math.max(
        quantity * unitPrice - lineDiscount,
        0
      );

      subtotal += lineSubtotal;
      tax += lineSubtotal * (taxRate / 100);
      cost += quantity * costPrice;
    });

    const headerDiscount = Number(quotationForm.discount || 0);
    const total = Math.max(subtotal - headerDiscount + tax, 0);
    const profit = subtotal - headerDiscount - cost;
    const margin =
      subtotal - headerDiscount > 0
        ? (profit / (subtotal - headerDiscount)) * 100
        : 0;

    return { subtotal, tax, total, cost, profit, margin };
  }, [quotationForm]);

  const saveQuotation = async () => {
    if (!project) return;

    const invalidItem = quotationForm.items.find(
      (item) =>
        !item.product_name.trim() ||
        Number(item.quantity || 0) <= 0 ||
        Number(item.unit_price || 0) < 0
    );

    if (invalidItem) {
      setQuotationError(
        "تأكد من اسم المنتج والكمية وسعر البيع لكل بند."
      );
      return;
    }

    try {
      setQuotationBusy(true);
      setQuotationError("");
      setQuotationMessage("");

      const isEdit = Boolean(editingQuotation?.id);

      const url = isEdit
        ? `${API_URL}/projects/${project.id}/quotations/${editingQuotation.id}`
        : `${API_URL}/projects/${project.id}/quotations`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          discount: Number(quotationForm.discount || 0),
          valid_until: quotationForm.valid_until || null,
          notes: quotationForm.notes.trim() || null,
          items: quotationForm.items.map((item, index) => ({
            product_id: item.product_id
              ? Number(item.product_id)
              : null,
            product_name: item.product_name.trim(),
            sku: item.sku.trim() || null,
            description: item.description.trim() || null,
            quantity: Number(item.quantity || 0),
            cost_price: Number(item.cost_price || 0),
            unit_price: Number(item.unit_price || 0),
            discount: Number(item.discount || 0),
            tax_rate: Number(item.tax_rate || 0),
            sort_order: index,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ||
            result.message ||
            "تعذر حفظ عرض السعر"
        );
      }

      setQuotationMessage(result.message || "تم حفظ عرض السعر بنجاح.");
      setQuotationEditorOpen(false);
      setEditingQuotation(null);
      await loadProject();
    } catch (error) {
      console.error("Save quotation error:", error);
      setQuotationError(error.message || "حدث خطأ أثناء حفظ عرض السعر");
    } finally {
      setQuotationBusy(false);
    }
  };

  const createQuotationRevision = async (quotationRow) => {
    if (!project || !quotationRow) return;

    if (!project.quotation_revision_required) {
      setQuotationError(
        "لا يوجد طلب تعديل مفتوح. يجب رجوع المشروع رسميًا إلى التسعير أولاً."
      );
      return;
    }

    try {
      setQuotationBusy(true);
      setQuotationError("");
      setQuotationMessage("");

      const response = await fetch(
        `${API_URL}/projects/${project.id}/quotations/${quotationRow.id}/revision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ||
            result.message ||
            "تعذر إنشاء Revision"
        );
      }

      setQuotationMessage(result.message || "تم إنشاء Revision جديد.");
      await loadProject();

      if (result.data) {
        onNavigate?.("pricing-builder", {
          projectId: project.id,
          quotationId: result.data.id,
        });
      }
    } catch (error) {
      console.error("Create quotation revision error:", error);
      setQuotationError(error.message || "حدث خطأ أثناء إنشاء Revision");
    } finally {
      setQuotationBusy(false);
    }
  };

  const approveQuotation = async (quotationRow) => {
    if (!project || !quotationRow) return;

    if (!window.confirm(
      `هل تريد اعتماد عرض السعر V${quotationRow.version || 1}؟`
    )) {
      return;
    }

    try {
      setQuotationBusy(true);
      setQuotationError("");
      setQuotationMessage("");

      const response = await fetch(
        `${API_URL}/projects/${project.id}/quotations/${quotationRow.id}/approve`,
        {
          method: "POST",
          headers: { Accept: "application/json" },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "تعذر اعتماد عرض السعر"
        );
      }

      setQuotationMessage(result.message || "تم اعتماد عرض السعر.");
      await loadProject();
    } catch (error) {
      console.error("Approve quotation error:", error);
      setQuotationError(error.message || "حدث خطأ أثناء اعتماد عرض السعر");
    } finally {
      setQuotationBusy(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Project Materials
  |--------------------------------------------------------------------------
  */

  const loadProjectMaterials = async () => {
    try {
      setMaterialsLoading(true);
      setMaterialsError("");

      const response = await fetch(
        `${API_URL}/inventory-transactions?project_id=${projectId}&type=OUT`,
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
            "تعذر تحميل المواد المصروفة للمشروع"
        );
      }

      setProjectMaterials(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (error) {
      console.error("Project materials error:", error);

      setMaterialsError(
        error.message ||
          "حدث خطأ أثناء تحميل مواد المشروع"
      );
    } finally {
      setMaterialsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Project Expenses
  |--------------------------------------------------------------------------
  */

  const loadProjectExpenses = async () => {
    try {
      setExpensesLoading(true);
      setExpensesError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/expenses`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "تعذر تحميل مصروفات المشروع"
        );
      }

      const rows = Array.isArray(result.data)
        ? result.data
        : Array.isArray(result.expenses)
          ? result.expenses
          : [];

      setProjectExpenses(rows);
    } catch (error) {
      console.error("Project expenses error:", error);
      setExpensesError(
        error.message || "حدث خطأ أثناء تحميل مصروفات المشروع"
      );
    } finally {
      setExpensesLoading(false);
    }
  };

  const handleExpenseFieldChange = (event) => {
    const { name, value } = event.target;

    setExpenseForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();

    const amount = Number(expenseForm.amount || 0);

    if (!expenseForm.description.trim()) {
      setExpensesError("اكتب وصف المصروف.");
      return;
    }

    if (amount <= 0) {
      setExpensesError("قيمة المصروف يجب أن تكون أكبر من صفر.");
      return;
    }

    try {
      setIsAddingExpense(true);
      setExpensesError("");
      setExpenseMessage("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            category: expenseForm.category,
            description: expenseForm.description.trim(),
            amount,
            expense_date: expenseForm.expense_date || null,
            reference: expenseForm.reference.trim() || null,
            notes: expenseForm.notes.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        const validationMessage = result.errors
          ? Object.values(result.errors).flat()[0]
          : null;

        throw new Error(
          validationMessage ||
            result.message ||
            "تعذر إضافة المصروف"
        );
      }

      setExpenseMessage("تم إضافة مصروف المشروع بنجاح.");

      setExpenseForm({
        category: "labor",
        description: "",
        amount: "",
        expense_date: new Date().toISOString().slice(0, 10),
        reference: "",
        notes: "",
      });

      await loadProjectExpenses();
    } catch (error) {
      console.error("Add project expense error:", error);
      setExpensesError(
        error.message || "حدث خطأ أثناء إضافة المصروف"
      );
    } finally {
      setIsAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("هل تريد حذف هذا المصروف؟")) {
      return;
    }

    try {
      setDeletingExpenseId(expenseId);
      setExpensesError("");
      setExpenseMessage("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}/expenses/${expenseId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
        }
      );

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || "تعذر حذف المصروف"
        );
      }

      setExpenseMessage("تم حذف المصروف بنجاح.");
      await loadProjectExpenses();
    } catch (error) {
      console.error("Delete project expense error:", error);
      setExpensesError(
        error.message || "حدث خطأ أثناء حذف المصروف"
      );
    } finally {
      setDeletingExpenseId(null);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Load Project
  |--------------------------------------------------------------------------
  */

  const loadProject = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const response = await fetch(
        `${API_URL}/projects/${projectId}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تحميل بيانات المشروع"
        );
      }

      setProject(result.data);
      setExecutionStatus(
        result.data?.execution_status || "in_progress"
      );
    } catch (error) {
      console.error(error);

      setLoadError(
        error.message ||
          "حدث خطأ أثناء تحميل المشروع"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
    loadProjectMaterials();
    loadProjectExpenses();
  }, [projectId]);

  /*
  |--------------------------------------------------------------------------
  | Move To Next Stage
  |--------------------------------------------------------------------------
  */

  const handleMoveToNextStage = async () => {
    if (!project) {
      return;
    }

    if (project.current_stage === "closed") {
      setMoveError(
        "المشروع موجود بالفعل في مرحلة الإغلاق."
      );

      return;
    }

    try {
      setIsMoving(true);

      setMoveMessage("");
      setMoveError("");

      const response = await fetch(
        `${API_URL}/projects/${project.id}/next-stage`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            notes:
              "تم تحويل المشروع من واجهة MASA ERP",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "تعذر تحويل المشروع للقسم التالي"
        );
      }

      const newStage =
        result.data.current_stage;

      setMoveMessage(
        `تم تحويل المشروع إلى ${
          stageNames[newStage] || newStage
        } بنجاح`
      );

      /*
       * نقرأ المشروع مرة أخرى من قاعدة البيانات
       * حتى تتحدث كل أجزاء الصفحة.
       */
      await loadProject();
    } catch (error) {
      console.error(error);

      setMoveError(
        error.message ||
          "حدث خطأ أثناء تحويل المشروع"
      );
    } finally {
      setIsMoving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Move To Previous Stage
  |--------------------------------------------------------------------------
  */

  const openReturnModal = () => {
    setReturnError("");
    setReturnReason("");
    setIsReturnModalOpen(true);
  };

  const closeReturnModal = () => {
    if (isReturning) return;

    setIsReturnModalOpen(false);
    setReturnReason("");
    setReturnError("");
  };

  const handleMoveToPreviousStage = async () => {
    if (!project) return;

    if (project.current_stage === "crm") {
      setMoveError("المشروع موجود بالفعل في أول مرحلة.");
      return;
    }

    if (!returnReason.trim()) {
      setReturnError("سبب الإرجاع مطلوب.");
      return;
    }

    try {
      setIsReturning(true);
      setReturnError("");
      setMoveMessage("");
      setMoveError("");

      const response = await fetch(
        `${API_URL}/projects/${project.id}/previous-stage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            notes: returnReason.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "تعذر إرجاع المشروع للقسم السابق"
        );
      }

      const newStage = result.data.current_stage;

      setMoveMessage(
        `تم إرجاع المشروع إلى ${
          stageNames[newStage] || newStage
        } بنجاح`
      );

      setIsReturnModalOpen(false);
      setReturnReason("");

      await loadProject();
    } catch (error) {
      console.error(error);

      setReturnError(
        error.message || "حدث خطأ أثناء إرجاع المشروع"
      );
    } finally {
      setIsReturning(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Create Purchase Order
  |--------------------------------------------------------------------------
  */

  const handleCreatePurchaseOrder = async () => {
    if (!project || isCreatingPurchaseOrder) {
      return;
    }

    if (project.current_stage !== "purchasing") {
      setPurchaseOrderError(
        "يمكن إنشاء أمر شراء عندما يكون المشروع في قسم المشتريات."
      );
      setPurchaseOrderMessage("");
      return;
    }

    try {
      setIsCreatingPurchaseOrder(true);
      setPurchaseOrderMessage("");
      setPurchaseOrderError("");

      const response = await fetch(
        `${API_URL}/projects/${project.id}/purchase-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            notes: "تم إنشاء أمر الشراء من واجهة MASA ERP",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "تعذر إنشاء أمر الشراء"
        );
      }

      setPurchaseOrderMessage(
        `تم إنشاء أمر الشراء ${
          result.data?.po_number || ""
        } بنجاح`
      );

      await loadProject();
    } catch (error) {
      console.error("Create purchase order error:", error);

      setPurchaseOrderError(
        error.message || "حدث خطأ أثناء إنشاء أمر الشراء"
      );
    } finally {
      setIsCreatingPurchaseOrder(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Dynamic Workflow
  |--------------------------------------------------------------------------
  */

  const workflow = useMemo(() => {
    const currentStage =
      project?.current_stage || "crm";

    const currentIndex =
      workflowStages.findIndex(
        (stage) =>
          stage.key === currentStage
      );

    return workflowStages.map(
      (stage, index) => {
        let status = "pending";

        if (index < currentIndex) {
          status = "completed";
        }

        if (index === currentIndex) {
          status = "current";
        }

        let note = "بانتظار المرحلة السابقة";

        if (status === "completed") {
          note = "تم الانتهاء";
        }

        if (status === "current") {
          note = "قيد العمل";
        }

        if (
          stage.key === "crm" &&
          status === "completed"
        ) {
          note = "تم إنشاء المشروع";
        }

        return {
          id: index + 1,
          ...stage,
          status,
          note,
        };
      }
    );
  }, [project?.current_stage]);

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const projectQuotations = [...(project?.quotations || [])].sort(
    (a, b) =>
      Number(b.version || 0) - Number(a.version || 0) ||
      Number(b.id || 0) - Number(a.id || 0)
  );

  const quotation = projectQuotations[0] || null;

  const purchaseOrders =
    project?.purchase_orders || [];

  const transactions =
    project?.financial_transactions || [];

  const attachments =
    project?.attachments || [];

  const projectNotes =
    project?.notes || [];

  const workflowHistory =
    project?.workflow_history || [];

  const projectMaterialSummary = useMemo(() => {
    const grouped = new Map();

    projectMaterials.forEach((transaction) => {
      const productId =
        transaction.product_id ||
        transaction.product?.id ||
        "unknown";

      const existing = grouped.get(productId) || {
        product_id: productId,
        name:
          transaction.product?.name ||
          "منتج غير محدد",
        sku:
          transaction.product?.sku || "-",
        unit:
          transaction.product?.unit || "قطعة",
        quantity: 0,
        total_cost: 0,
      };

      const quantity = Number(
        transaction.quantity || 0
      );

      const unitCost = Number(
        transaction.unit_cost || 0
      );

      existing.quantity += quantity;
      existing.total_cost += quantity * unitCost;

      grouped.set(productId, existing);
    });

    return Array.from(grouped.values());
  }, [projectMaterials]);

  const projectMaterialsTotalQuantity =
    projectMaterialSummary.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

  const projectMaterialsTotalCost =
    projectMaterialSummary.reduce(
      (sum, item) => sum + item.total_cost,
      0
    );

  const projectRevenue = Number(
    project?.total_value ||
      quotation?.total ||
      0
  );

  const projectExpensesTotal = projectExpenses.reduce(
    (sum, expense) =>
      sum +
      Number(
        expense.amount ||
          expense.total ||
          expense.value ||
          0
      ),
    0
  );

  const netProjectProfit =
    projectRevenue -
    projectMaterialsTotalCost -
    projectExpensesTotal;

  const netProjectMargin =
    projectRevenue > 0
      ? (netProjectProfit / projectRevenue) * 100
      : 0;

  const invoicedTotal = transactions
    .filter(
      (item) =>
        item.type === "customer_invoice"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.total || 0),
      0
    );

  const paidTotal = transactions
    .filter(
      (item) =>
        item.type === "customer_payment"
    )
    .reduce(
      (sum, item) =>
        sum +
        Number(
          item.paid_amount ||
            item.total ||
            0
        ),
      0
    );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading && !project) {
    return (
      <div
        className="project-file-page"
        dir="rtl"
      >
        <div className="project-loading">
          جاري تحميل ملف المشروع...
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (loadError && !project) {
    return (
      <div
        className="project-file-page"
        dir="rtl"
      >
        <div className="project-error-box">
          <strong>
            تعذر تحميل المشروع
          </strong>

          <span>{loadError}</span>

          <button
            type="button"
            onClick={loadProject}
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div
      className="project-file-page"
      dir="rtl"
    >
      {/* =====================================================
          TOP
      ====================================================== */}

      <div className="project-file-topbar">
        <div className="project-title-area">
          <div className="project-breadcrumb">
            المشاريع
            <span>/</span>
            متابعة المشاريع
            <span>/</span>
            ملف المشروع
          </div>

          <div className="project-title-row-main">
            <div>
              {onBack && (
                <button
                  type="button"
                  className="project-back-to-orders"
                  onClick={onBack}
                >
                  الرجوع لأوامر العمل
                </button>
              )}

              <h1>{project.name}</h1>

              <div className="project-meta-line">
                <span className="project-code">
                  {project.project_code}
                </span>

                <span className="project-status active">
                  {project.status === "completed"
                    ? "مكتمل"
                    : "قيد التنفيذ"}
                </span>

                <span>أمر عمل</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="project-main-actions">
            <button
              type="button"
              className="project-secondary-btn"
            >
              <MoreHorizontal size={17} />
              المزيد
            </button>

            <button
              type="button"
              className="project-secondary-btn"
            >
              <Edit3 size={16} />
              تحرير
            </button>

            <div className="project-print-group">
              <button
                type="button"
                className="project-secondary-btn"
              >
                <Printer size={16} />
                طباعة / تصدير
              </button>
            </div>

            <button
              className="project-return-btn"
              type="button"
              onClick={openReturnModal}
              disabled={
                isReturning ||
                project.current_stage === "crm"
              }
            >
              <Undo2 size={17} />

              {project.current_stage === "crm"
                ? "لا توجد مرحلة سابقة"
                : "إرجاع للقسم السابق"}
            </button>

            <button
              className="project-primary-btn"
              type="button"
              onClick={
                handleMoveToNextStage
              }
              disabled={
                isMoving ||
                isReturning ||
                project.current_stage ===
                  "closed"
              }
            >
              <Send size={17} />

              {isMoving
                ? "جاري التحويل..."
                : project.current_stage ===
                    "closed"
                  ? "تم إغلاق المشروع"
                  : "إرسال للقسم التالي"}
            </button>
          </div>

          {moveMessage && (
            <div className="project-move-message">
              {moveMessage}
            </div>
          )}

          {moveError && (
            <div className="project-move-error">
              {moveError}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          CUSTOMER + PROJECT INFORMATION
      ====================================================== */}

      <section className="project-info-card">
        <div className="project-info-item">
          <div className="info-icon">
            <Building2 size={18} />
          </div>

          <div>
            <span>العميل</span>

            <strong>
              {project.customer_name}
            </strong>

            <small>
              {project.customer_code || "-"}
            </small>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <Phone size={18} />
          </div>

          <div>
            <span>الجوال</span>

            <strong>
              {project.phone || "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <Mail size={18} />
          </div>

          <div>
            <span>
              البريد الإلكتروني
            </span>

            <strong>
              {project.email || "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <MapPin size={18} />
          </div>

          <div>
            <span>العنوان</span>

            <strong>
              {project.address || "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <FileText size={18} />
          </div>

          <div>
            <span>السجل التجاري</span>

            <strong>
              {project.commercial_register ||
                "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <ReceiptText size={18} />
          </div>

          <div>
            <span>الرقم الضريبي</span>

            <strong>
              {project.tax_number || "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <UserRound size={18} />
          </div>

          <div>
            <span>مدير المشروع</span>

            <strong>
              {project.project_manager ||
                "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <Users size={18} />
          </div>

          <div>
            <span>مسؤول العميل</span>

            <strong>
              {project.account_manager ||
                "-"}
            </strong>
          </div>
        </div>

        <div className="project-info-item">
          <div className="info-icon">
            <CalendarDays size={18} />
          </div>

          <div>
            <span>تاريخ الإنشاء</span>

            <strong>
              {formatDate(
                project.created_at
              )}
            </strong>
          </div>
        </div>
      </section>

      {/* =====================================================
          WORKFLOW
      ====================================================== */}

      <section className="project-workflow-card">
        <div className="current-department">
          <div className="current-department-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>القسم الحالي</span>

            <strong>
              {stageNames[
                project.current_stage
              ] || project.current_stage}
            </strong>
          </div>
        </div>

        <div className="workflow-track">
          {workflow.map((step) => (
            <div
              key={step.id}
              className={`workflow-step ${step.status}`}
            >
              <div className="workflow-number">
                {step.status ===
                "completed" ? (
                  <CheckCircle2
                    size={18}
                  />
                ) : (
                  step.id
                )}
              </div>

              <strong>
                {step.name}
              </strong>

              <span>
                {step.note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================
          TABS
      ====================================================== */}

      <div className="project-tabs">
        <button className="active">
          نظرة عامة
        </button>

        <button>
          بيانات العميل
        </button>

        <button>
          عرض السعر
        </button>

        <button>
          المشتريات
        </button>

        <button>
          المالية
        </button>

        <button>
          الملفات
        </button>

        <button>
          الملاحظات
        </button>

        <button>
          سجل الأنشطة
        </button>
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="project-content-grid">
        {/* SIDE */}

        <aside className="project-side-column">
          <section className="project-widget">
            <div className="project-widget-header">
              <h3>
                معلومات المشروع
              </h3>
            </div>

            <div className="project-summary-list">
              <div>
                <span>
                  نوع المشروع
                </span>

                <strong>
                  {project.project_type ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>
                  أولوية المشروع
                </span>

                <strong
                  className={
                    project.priority ===
                    "high"
                      ? "priority-high"
                      : ""
                  }
                >
                  {project.priority ===
                  "high"
                    ? "عالية"
                    : project.priority ===
                        "low"
                      ? "منخفضة"
                      : "عادية"}
                </strong>
              </div>

              <div>
                <span>
                  تاريخ البدء المتوقع
                </span>

                <strong>
                  {formatDate(
                    project.expected_start_date
                  )}
                </strong>
              </div>

              <div>
                <span>
                  تاريخ الانتهاء المتوقع
                </span>

                <strong>
                  {formatDate(
                    project.expected_end_date
                  )}
                </strong>
              </div>

              <div>
                <span>
                  القيمة الإجمالية
                </span>

                <strong>
                  {formatMoney(
                    project.total_value
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="project-widget">
            <div className="project-widget-header">
              <h3>
                الفريق المسؤول
              </h3>
            </div>

            <div className="project-team-list">
              <div>
                <span className="member-avatar">
                  {getInitials(
                    project.project_manager
                  )}
                </span>

                <div>
                  <strong>
                    {project.project_manager ||
                      "غير محدد"}
                  </strong>

                  <span>
                    مدير المشروع
                  </span>
                </div>
              </div>

              <div>
                <span className="member-avatar">
                  {getInitials(
                    project.account_manager
                  )}
                </span>

                <div>
                  <strong>
                    {project.account_manager ||
                      "غير محدد"}
                  </strong>

                  <span>
                    مسؤول العميل
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="project-permission-badge">
            <ShieldCheck size={18} />

            <div>
              <strong>
                صلاحيات المدير العام
              </strong>

              <span>
                لديك صلاحية مشاهدة
                جميع تفاصيل المشروع
              </span>
            </div>
          </section>
        </aside>

        {/* MAIN */}

        <main className="project-main-column">
          {/* MODULE CARDS */}

          <div className="project-module-grid">
            {/* QUOTATION */}

            <article
              className="project-module-card"
              style={{
                position: "relative",
                overflow: "hidden",
                padding: "20px",
                minHeight: "250px",
                border: "1px solid #e8e7ff",
                background:
                  "linear-gradient(180deg, #ffffff 0%, #fbfaff 100%)",
                boxShadow: "0 10px 28px rgba(98,87,255,.07)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-45px",
                  left: "-35px",
                  width: "130px",
                  height: "130px",
                  borderRadius: "50%",
                  background: "rgba(98,87,255,.06)",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "14px",
                      background: "#f0edff",
                      color: "#6257ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileText size={22} />
                  </div>

                  <div>
                    <span
                      style={{
                        display: "block",
                        color: "#8f96a8",
                        fontSize: "11px",
                        marginBottom: "3px",
                      }}
                    >
                      عرض السعر
                    </span>

                    <strong
                      style={{
                        display: "block",
                        color: "#1f2430",
                        fontSize: "14px",
                      }}
                    >
                      {quotation
                        ? quotation.quotation_number
                        : "لم يتم إنشاء عرض"}
                    </strong>
                  </div>
                </div>

                {quotation && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "7px 10px",
                      borderRadius: "999px",
                      background:
                        quotation.status === "approved"
                          ? "#ecfdf3"
                          : "#fff7ed",
                      color:
                        quotation.status === "approved"
                          ? "#15803d"
                          : "#c2410c",
                      fontSize: "11px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {quotation.status === "approved" ? (
                      <CheckCircle2 size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}

                    V{quotation.version || 1} ·{" "}
                    {quotation.status === "approved"
                      ? "معتمد"
                      : quotation.status === "draft"
                        ? "مسودة"
                        : quotation.status}
                  </span>
                )}
              </div>

              {quotation ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "9px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        background: "#f8f7ff",
                        border: "1px solid #eceaff",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#989fb1",
                          fontSize: "10px",
                          marginBottom: "5px",
                        }}
                      >
                        القيمة الإجمالية
                      </span>

                      <strong
                        style={{
                          color: "#262b36",
                          fontSize: "15px",
                        }}
                      >
                        {formatMoney(quotation.total)}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: "12px",
                        borderRadius: "12px",
                        background: "#fafbfc",
                        border: "1px solid #eceef3",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          color: "#989fb1",
                          fontSize: "10px",
                          marginBottom: "5px",
                        }}
                      >
                        عدد الإصدارات
                      </span>

                      <strong
                        style={{
                          color: "#262b36",
                          fontSize: "15px",
                        }}
                      >
                        {projectQuotations.length}
                      </strong>
                    </div>
                  </div>

                  {project.quotation_revision_required && (
                    <div
                      style={{
                        padding: "10px 11px",
                        borderRadius: "10px",
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#9a3412",
                        fontSize: "11px",
                        lineHeight: 1.7,
                        marginBottom: "12px",
                      }}
                    >
                      <strong>تعديل مطلوب:</strong>{" "}
                      {project.quotation_revision_reason ||
                        "المشروع رجع للتسعير ويحتاج Revision جديد"}
                    </div>
                  )}

                  {quotation.revision_reason && (
                    <div
                      style={{
                        padding: "10px 11px",
                        borderRadius: "10px",
                        background: "#fffaf3",
                        border: "1px solid #ffedd5",
                        color: "#9a5a16",
                        fontSize: "11px",
                        lineHeight: 1.7,
                        marginBottom: "12px",
                      }}
                    >
                      <strong>سبب التعديل:</strong>{" "}
                      {quotation.revision_reason}
                    </div>
                  )}

                  {project.current_stage === "pricing" && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          quotation.status === "approved"
                            ? "1fr"
                            : "1fr 1fr",
                        gap: "8px",
                        marginTop: "auto",
                      }}
                    >
                      {quotation.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => openEditQuotation(quotation)}
                          disabled={quotationBusy}
                          style={{
                            minHeight: "42px",
                            border: "1px solid #dcd8ff",
                            background: "#f7f5ff",
                            color: "#5b50e6",
                            borderRadius: "10px",
                            fontFamily: "inherit",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <Edit3 size={15} />
                          تعديل V{quotation.version || 1}
                        </button>
                      )}

                      {quotation.status === "approved" &&
                        project.quotation_revision_required && (
                        <button
                          type="button"
                          onClick={() =>
                            createQuotationRevision(quotation)
                          }
                          disabled={quotationBusy}
                          style={{
                            minHeight: "42px",
                            border: 0,
                            background:
                              "linear-gradient(135deg,#6c5cff,#5748ee)",
                            color: "#fff",
                            borderRadius: "10px",
                            fontFamily: "inherit",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <RotateCcw size={15} />
                          إنشاء Revision جديد
                        </button>
                      )}

                      {quotation.status === "approved" &&
                        !project.quotation_revision_required && (
                        <div
                          style={{
                            gridColumn: "1 / -1",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            background: "#f8fafc",
                            border: "1px solid #e8ebf0",
                            color: "#70798c",
                            fontSize: "11px",
                            lineHeight: 1.6,
                            textAlign: "center",
                          }}
                        >
                          لا يوجد طلب تعديل مفتوح على عرض السعر الحالي.
                        </div>
                      )}

                      {quotation.status !== "approved" && (
                        <button
                          type="button"
                          onClick={() => approveQuotation(quotation)}
                          disabled={quotationBusy}
                          style={{
                            minHeight: "42px",
                            border: "1px solid #b7efc8",
                            background: "#effcf4",
                            color: "#16803d",
                            borderRadius: "10px",
                            fontFamily: "inherit",
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <CheckCircle2 size={15} />
                          اعتماد العرض
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    style={{
                      minHeight: "105px",
                      border: "1px dashed #d8d5ff",
                      borderRadius: "13px",
                      background: "#faf9ff",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    <FileText
                      size={24}
                      style={{ color: "#8d83ff", marginBottom: "8px" }}
                    />
                    <strong
                      style={{
                        fontSize: "13px",
                        color: "#404656",
                      }}
                    >
                      لا يوجد عرض سعر
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "#9aa1b2",
                        marginTop: "4px",
                      }}
                    >
                      أنشئ أول نسخة لبدء عملية التسعير
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateQuotation}
                    disabled={
                      quotationBusy ||
                      project.current_stage !== "pricing"
                    }
                    style={{
                      width: "100%",
                      minHeight: "42px",
                      border: 0,
                      background:
                        project.current_stage === "pricing"
                          ? "linear-gradient(135deg,#6c5cff,#5748ee)"
                          : "#eef0f4",
                      color:
                        project.current_stage === "pricing"
                          ? "#fff"
                          : "#9ca3af",
                      borderRadius: "10px",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      cursor:
                        project.current_stage === "pricing"
                          ? "pointer"
                          : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Plus size={15} />
                    {project.current_stage === "pricing"
                      ? "إنشاء عرض سعر V1"
                      : "متاح في قسم التسعير"}
                  </button>
                </>
              )}

              {quotationMessage && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "9px 10px",
                    borderRadius: "9px",
                    background: "#ecfdf3",
                    color: "#15803d",
                    fontSize: "11px",
                    lineHeight: 1.6,
                  }}
                >
                  {quotationMessage}
                </div>
              )}

              {quotationError && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "9px 10px",
                    borderRadius: "9px",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontSize: "11px",
                    lineHeight: 1.6,
                  }}
                >
                  {quotationError}
                </div>
              )}
            </article>

            {/* PURCHASES */}

            <article className="project-module-card">
              <div className="module-card-icon orange">
                <ShoppingCart size={22} />
              </div>

              <span className="module-label">
                المشتريات
              </span>

              {purchaseOrders.length ? (
                <>
                  <strong className="module-value">
                    {
                      purchaseOrders.length
                    }{" "}
                    أمر شراء
                  </strong>

                  <span className="module-description">
                    آخر أمر شراء:{" "}
                    {purchaseOrders[0]
                      ?.po_number || "-"}
                  </span>

                  <div className="module-card-details">
                    <span>
                      إجمالي المشتريات
                    </span>

                    <strong>
                      {formatMoney(
                        purchaseOrders.reduce(
                          (
                            sum,
                            order
                          ) =>
                            sum +
                            Number(
                              order.total ||
                                0
                            ),
                          0
                        )
                      )}
                    </strong>
                  </div>

                  <button
                    className="orange-button"
                    type="button"
                    onClick={onOpenPurchases}
                    >
                    عرض المشتريات
                  </button>

                  {purchaseOrderMessage && (
                    <div className="purchase-order-message">
                      {purchaseOrderMessage}
                    </div>
                  )}

                  {purchaseOrderError && (
                    <div className="purchase-order-error">
                      {purchaseOrderError}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <strong className="module-value empty">
                    لا توجد طلبات شراء
                  </strong>

                  <span className="module-description">
                    لم يتم إنشاء أي
                    طلب شراء لهذا
                    المشروع
                  </span>

                  <button
                    type="button"
                    className="orange-button"
                    onClick={handleCreatePurchaseOrder}
                    disabled={isCreatingPurchaseOrder}
                  >
                    <Plus size={14} />

                    {isCreatingPurchaseOrder
                      ? "جاري إنشاء أمر الشراء..."
                      : "إنشاء أمر شراء"}
                  </button>

                  {purchaseOrderMessage && (
                    <div className="purchase-order-message">
                      {purchaseOrderMessage}
                    </div>
                  )}

                  {purchaseOrderError && (
                    <div className="purchase-order-error">
                      {purchaseOrderError}
                    </div>
                  )}
                </>
              )}
            </article>

            {/* FINANCE */}

            <article className="project-module-card">
              <div className="module-card-icon green">
                <WalletCards size={22} />
              </div>

              <span className="module-label">
                الفواتير والمدفوعات
              </span>

              <strong className="module-value">
                {formatMoney(
                  invoicedTotal
                )}
              </strong>

              <div className="finance-mini-grid">
                <div>
                  <span>مفوتر</span>

                  <strong>
                    {formatMoney(
                      invoicedTotal
                    )}
                  </strong>
                </div>

                <div>
                  <span>مدفوع</span>

                  <strong>
                    {formatMoney(
                      paidTotal
                    )}
                  </strong>
                </div>
              </div>

              <button type="button">
                عرض التفاصيل
              </button>
            </article>

            {/* FILES */}

            <article className="project-module-card">
              <div className="module-card-icon blue">
                <FolderOpen size={22} />
              </div>

              <span className="module-label">
                المرفقات
              </span>

              <strong className="module-value">
                {attachments.length}
              </strong>

              <span className="module-description">
                {attachments.length
                  ? `آخر ملف مرفق: ${
                      attachments[0]
                        ?.original_name ||
                      attachments[0]
                        ?.file_name ||
                      "-"
                    }`
                  : "لا توجد مرفقات حتى الآن"}
              </span>

              <button type="button">
                عرض جميع الملفات
              </button>
            </article>
          </div>

          {/* =================================================
              EXECUTION MANAGEMENT
          ================================================== */}

          {project.current_stage === "execution" && (
            <section
              className="project-widget"
              style={{ marginTop: "18px", overflow: "hidden" }}
            >
              <div
                className="project-widget-header"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#eef2ff",
                      color: "#6257ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Activity size={21} />
                  </div>

                  <div>
                    <h3 style={{ margin: 0 }}>إدارة التنفيذ</h3>
                    <span
                      style={{
                        display: "block",
                        marginTop: "4px",
                        color: "#9aa0af",
                        fontSize: "12px",
                      }}
                    >
                      متابعة التنفيذ وإدارة العوائق وإرجاع المشروع للقسم المطلوب
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    padding: "7px 12px",
                    borderRadius: "999px",
                    background:
                      project.execution_status === "on_hold"
                        ? "#fff1f2"
                        : "#ecfdf3",
                    color:
                      project.execution_status === "on_hold"
                        ? "#dc2626"
                        : "#15803d",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  {executionStatusLabel(
                    project.execution_status || "in_progress"
                  )}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 2fr",
                  gap: "10px",
                  marginTop: "16px",
                }}
              >
                <select
                  value={executionStatus}
                  onChange={(event) =>
                    setExecutionStatus(event.target.value)
                  }
                  style={{
                    minHeight: "44px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                    background: "#fff",
                  }}
                >
                  {executionStatuses.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <select
                  value={returnTargetStage}
                  onChange={(event) =>
                    setReturnTargetStage(event.target.value)
                  }
                  style={{
                    minHeight: "44px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                    background: "#fff",
                  }}
                >
                  {executionStageOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      رجوع إلى {item.label}
                    </option>
                  ))}
                </select>

                <input
                  value={executionReason}
                  onChange={(event) =>
                    setExecutionReason(event.target.value)
                  }
                  placeholder="السبب / الملاحظة: تعديل عرض السعر، نقص مواد، عائق بالموقع..."
                  style={{
                    minHeight: "44px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginTop: "12px",
                }}
              >
                <button
                  type="button"
                  disabled={executionBusy}
                  onClick={handleUpdateExecutionStatus}
                  style={{
                    border: 0,
                    borderRadius: "10px",
                    minHeight: "42px",
                    padding: "0 17px",
                    background: "#6257ff",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <Activity size={16} style={{ marginLeft: "7px" }} />
                  تحديث حالة التنفيذ
                </button>

                <button
                  type="button"
                  disabled={executionBusy}
                  onClick={handleHoldExecution}
                  style={{
                    border: "1px solid #fecdd3",
                    borderRadius: "10px",
                    minHeight: "42px",
                    padding: "0 17px",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <PauseCircle size={16} style={{ marginLeft: "7px" }} />
                  إيقاف بسبب عائق
                </button>

                <button
                  type="button"
                  disabled={executionBusy}
                  onClick={handleResumeExecution}
                  style={{
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    minHeight: "42px",
                    padding: "0 17px",
                    background: "#ecfdf3",
                    color: "#15803d",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <PlayCircle size={16} style={{ marginLeft: "7px" }} />
                  استئناف التنفيذ
                </button>

                <button
                  type="button"
                  disabled={executionBusy}
                  onClick={handleReturnToStage}
                  style={{
                    border: "1px solid #fed7aa",
                    borderRadius: "10px",
                    minHeight: "42px",
                    padding: "0 17px",
                    background: "#fff7ed",
                    color: "#ea580c",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={16} style={{ marginLeft: "7px" }} />
                  إرجاع للقسم المحدد
                </button>
              </div>

              {project.execution_hold_reason && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "11px 13px",
                    borderRadius: "10px",
                    background: "#fff7ed",
                    color: "#9a3412",
                    fontSize: "12px",
                  }}
                >
                  <strong>آخر سبب إيقاف: </strong>
                  {project.execution_hold_reason}
                </div>
              )}

              {executionMessage && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#ecfdf3",
                    color: "#15803d",
                    fontSize: "12px",
                  }}
                >
                  {executionMessage}
                </div>
              )}

              {executionError && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#fff1f2",
                    color: "#dc2626",
                    fontSize: "12px",
                  }}
                >
                  {executionError}
                </div>
              )}
            </section>
          )}

          {/* =================================================
              PROJECT PROFITABILITY
          ================================================== */}

          <section
            className="project-widget"
            style={{
              marginTop: "18px",
              overflow: "hidden",
            }}
          >
            <div
              className="project-widget-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "11px",
                    background: "#ecfdf3",
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp size={20} />
                </div>

                <div>
                  <h3 style={{ margin: 0 }}>
                    ربحية المشروع
                  </h3>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#9aa0af",
                      fontSize: "12px",
                    }}
                  >
                    صافي الربح بعد تكلفة المواد ومصروفات المشروع
                  </span>
                </div>
              </div>

              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "#f8fafc",
                  color: "#64748b",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                يشمل المصروفات المسجلة
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(5, minmax(0, 1fr))",
                gap: "12px",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  border: "1px solid #eceef5",
                  borderRadius: "12px",
                  background: "#fafbfe",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  قيمة المشروع
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "18px",
                  }}
                >
                  {formatMoney(projectRevenue)}
                </strong>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #eceef5",
                  borderRadius: "12px",
                  background: "#fff7ed",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  تكلفة المواد المصروفة
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "18px",
                    color: "#ea580c",
                  }}
                >
                  {formatMoney(projectMaterialsTotalCost)}
                </strong>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #fee2e2",
                  borderRadius: "12px",
                  background: "#fff7f7",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  مصروفات المشروع
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "18px",
                    color: "#dc2626",
                  }}
                >
                  {formatMoney(projectExpensesTotal)}
                </strong>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #d1fae5",
                  borderRadius: "12px",
                  background:
                    netProjectProfit >= 0
                      ? "#ecfdf3"
                      : "#fff1f2",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  صافي ربح المشروع
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "18px",
                    color:
                      netProjectProfit >= 0
                        ? "#15803d"
                        : "#dc2626",
                  }}
                >
                  {formatMoney(netProjectProfit)}
                </strong>
              </div>

              <div
                style={{
                  padding: "16px",
                  border: "1px solid #ddd6fe",
                  borderRadius: "12px",
                  background: "#f5f3ff",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  هامش صافي الربح
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "18px",
                    color: "#6257ff",
                  }}
                >
                  {netProjectMargin.toFixed(1)}%
                </strong>
              </div>
            </div>

            {projectRevenue <= 0 && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#fff7ed",
                  color: "#c2410c",
                  fontSize: "12px",
                }}
              >
                قيمة المشروع غير محددة حتى الآن، لذلك هامش الربح لن يكون دقيقًا.
              </div>
            )}
          </section>

          {/* =================================================
              PROJECT EXPENSES
          ================================================== */}

          <section
            className="project-widget"
            style={{
              marginTop: "18px",
              overflow: "hidden",
            }}
          >
            <div
              className="project-widget-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "11px",
                    background: "#fff7ed",
                    color: "#ea580c",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ReceiptText size={20} />
                </div>

                <div>
                  <h3 style={{ margin: 0 }}>
                    مصروفات المشروع
                  </h3>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#9aa0af",
                      fontSize: "12px",
                    }}
                  >
                    العمالة والنقل والتركيب والمقاولين والمصروفات الأخرى
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={loadProjectExpenses}
                disabled={expensesLoading}
                style={{
                  border: "1px solid #fed7aa",
                  borderRadius: "9px",
                  background: "#fff7ed",
                  color: "#ea580c",
                  padding: "8px 12px",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {expensesLoading
                  ? "جاري التحديث..."
                  : "تحديث"}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "12px",
                margin: "16px 0",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  border: "1px solid #eceef5",
                  borderRadius: "12px",
                  background: "#fafbfe",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  عدد المصروفات
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "18px",
                  }}
                >
                  {projectExpenses.length}
                </strong>
              </div>

              <div
                style={{
                  padding: "14px",
                  border: "1px solid #fee2e2",
                  borderRadius: "12px",
                  background: "#fff7f7",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  إجمالي مصروفات المشروع
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "18px",
                    color: "#dc2626",
                  }}
                >
                  {formatMoney(projectExpensesTotal)}
                </strong>
              </div>
            </div>

            <form
              onSubmit={handleAddExpense}
              style={{
                border: "1px solid #eceef5",
                borderRadius: "12px",
                padding: "14px",
                background: "#fafbfe",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1.6fr 1fr 1fr",
                  gap: "10px",
                }}
              >
                <select
                  name="category"
                  value={expenseForm.category}
                  onChange={handleExpenseFieldChange}
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "9px",
                    padding: "0 10px",
                    fontFamily: "inherit",
                    background: "#fff",
                  }}
                >
                  <option value="labor">عمالة</option>
                  <option value="transport">نقل</option>
                  <option value="installation">تركيب</option>
                  <option value="subcontractor">مقاول باطن</option>
                  <option value="rental">إيجارات</option>
                  <option value="other">أخرى</option>
                </select>

                <input
                  name="description"
                  value={expenseForm.description}
                  onChange={handleExpenseFieldChange}
                  placeholder="وصف المصروف"
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "9px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                  }}
                />

                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={handleExpenseFieldChange}
                  placeholder="القيمة"
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "9px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                  }}
                />

                <input
                  name="expense_date"
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={handleExpenseFieldChange}
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "9px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr auto",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <input
                  name="reference"
                  value={expenseForm.reference}
                  onChange={handleExpenseFieldChange}
                  placeholder="المرجع - اختياري"
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "9px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                  }}
                />

                <input
                  name="notes"
                  value={expenseForm.notes}
                  onChange={handleExpenseFieldChange}
                  placeholder="ملاحظات - اختياري"
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "9px",
                    padding: "0 12px",
                    fontFamily: "inherit",
                  }}
                />

                <button
                  type="submit"
                  disabled={isAddingExpense}
                  style={{
                    border: 0,
                    borderRadius: "9px",
                    padding: "0 18px",
                    minHeight: "42px",
                    background: "#6257ff",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {isAddingExpense
                    ? "جاري الإضافة..."
                    : "إضافة مصروف"}
                </button>
              </div>
            </form>

            {expenseMessage && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#ecfdf3",
                  color: "#15803d",
                  fontSize: "12px",
                }}
              >
                {expenseMessage}
              </div>
            )}

            {expensesError && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#fff1f2",
                  color: "#dc2626",
                  fontSize: "12px",
                }}
              >
                {expensesError}
              </div>
            )}

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
                    "0.8fr 1.7fr 0.9fr 0.9fr 1fr 0.5fr",
                  gap: "10px",
                  padding: "11px 13px",
                  background: "#fafbfe",
                  color: "#8d94a5",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <span>النوع</span>
                <span>الوصف</span>
                <span>القيمة</span>
                <span>التاريخ</span>
                <span>المرجع</span>
                <span>حذف</span>
              </div>

              {expensesLoading && !projectExpenses.length ? (
                <div
                  style={{
                    padding: "22px",
                    textAlign: "center",
                    color: "#9aa0af",
                  }}
                >
                  جاري تحميل مصروفات المشروع...
                </div>
              ) : projectExpenses.length ? (
                projectExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "0.8fr 1.7fr 0.9fr 0.9fr 1fr 0.5fr",
                      gap: "10px",
                      padding: "13px",
                      borderTop: "1px solid #f0f1f6",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                  >
                    <span>
                      {expense.category === "labor"
                        ? "عمالة"
                        : expense.category === "transport"
                          ? "نقل"
                          : expense.category === "installation"
                            ? "تركيب"
                            : expense.category === "subcontractor"
                              ? "مقاول باطن"
                              : expense.category === "rental"
                                ? "إيجارات"
                                : "أخرى"}
                    </span>

                    <strong>
                      {expense.description ||
                        expense.title ||
                        "-"}
                    </strong>

                    <strong style={{ color: "#dc2626" }}>
                      {formatMoney(
                        expense.amount ||
                          expense.total ||
                          expense.value
                      )}
                    </strong>

                    <span>
                      {formatDate(
                        expense.expense_date ||
                          expense.date ||
                          expense.created_at
                      )}
                    </span>

                    <span>
                      {expense.reference || "-"}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteExpense(expense.id)
                      }
                      disabled={
                        deletingExpenseId === expense.id
                      }
                      title="حذف المصروف"
                      style={{
                        width: "34px",
                        height: "34px",
                        border: "1px solid #fecdd3",
                        borderRadius: "8px",
                        background: "#fff1f2",
                        color: "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "22px",
                    textAlign: "center",
                    color: "#9aa0af",
                  }}
                >
                  لا توجد مصروفات مسجلة على المشروع حتى الآن.
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              PROJECT MATERIALS
          ================================================== */}

          <section
            className="project-widget"
            style={{
              marginTop: "18px",
              overflow: "hidden",
            }}
          >
            <div
              className="project-widget-header"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "11px",
                    background: "#f5f3ff",
                    color: "#6257ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Boxes size={20} />
                </div>

                <div>
                  <h3 style={{ margin: 0 }}>
                    مواد المشروع
                  </h3>

                  <span
                    style={{
                      display: "block",
                      marginTop: "4px",
                      color: "#9aa0af",
                      fontSize: "12px",
                    }}
                  >
                    المنتجات المصروفة من المخزون لهذا المشروع
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={loadProjectMaterials}
                disabled={materialsLoading}
                style={{
                  border: "1px solid #ddd6fe",
                  borderRadius: "9px",
                  background: "#f5f3ff",
                  color: "#6257ff",
                  padding: "8px 12px",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {materialsLoading
                  ? "جاري التحديث..."
                  : "تحديث"}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: "12px",
                margin: "16px 0",
              }}
            >
              <div
                style={{
                  padding: "14px",
                  border: "1px solid #eceef5",
                  borderRadius: "12px",
                  background: "#fafbfe",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  عدد الأصناف
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "18px",
                  }}
                >
                  {projectMaterialSummary.length}
                </strong>
              </div>

              <div
                style={{
                  padding: "14px",
                  border: "1px solid #eceef5",
                  borderRadius: "12px",
                  background: "#fafbfe",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  إجمالي الكمية المصروفة
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "18px",
                  }}
                >
                  {projectMaterialsTotalQuantity}
                </strong>
              </div>

              <div
                style={{
                  padding: "14px",
                  border: "1px solid #eceef5",
                  borderRadius: "12px",
                  background: "#fafbfe",
                }}
              >
                <span
                  style={{
                    color: "#9aa0af",
                    fontSize: "11px",
                  }}
                >
                  تكلفة المواد المصروفة
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "18px",
                    color: "#6257ff",
                  }}
                >
                  {formatMoney(projectMaterialsTotalCost)}
                </strong>
              </div>
            </div>

            {materialsError && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "#fff1f2",
                  color: "#dc2626",
                  fontSize: "12px",
                }}
              >
                {materialsError}
              </div>
            )}

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
                    "1.6fr 0.8fr 0.7fr 0.9fr 1fr",
                  gap: "10px",
                  padding: "11px 13px",
                  background: "#fafbfe",
                  color: "#8d94a5",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <span>المنتج</span>
                <span>SKU</span>
                <span>الكمية</span>
                <span>الوحدة</span>
                <span>التكلفة</span>
              </div>

              {materialsLoading &&
              !projectMaterialSummary.length ? (
                <div
                  style={{
                    padding: "22px",
                    textAlign: "center",
                    color: "#9aa0af",
                  }}
                >
                  جاري تحميل مواد المشروع...
                </div>
              ) : projectMaterialSummary.length ? (
                projectMaterialSummary.map((item) => (
                  <div
                    key={item.product_id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "1.6fr 0.8fr 0.7fr 0.9fr 1fr",
                      gap: "10px",
                      padding: "13px",
                      borderTop:
                        "1px solid #f0f1f6",
                      alignItems: "center",
                      fontSize: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <ArrowUpFromLine
                        size={15}
                        color="#dc2626"
                      />

                      <strong>{item.name}</strong>
                    </div>

                    <span>{item.sku}</span>

                    <strong>
                      {item.quantity}
                    </strong>

                    <span>{item.unit}</span>

                    <strong>
                      {formatMoney(
                        item.total_cost
                      )}
                    </strong>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "22px",
                    textAlign: "center",
                    color: "#9aa0af",
                  }}
                >
                  لم يتم صرف مواد من المخزون لهذا المشروع حتى الآن.
                </div>
              )}
            </div>
          </section>

          {/* =================================================
              NOTES + ACTIVITY
          ================================================== */}

          <div className="project-lower-grid">
            {/* NOTES */}

            <section className="project-widget project-notes">
              <div className="project-widget-header">
                <h3>
                  آخر الملاحظات
                </h3>

                <button type="button">
                  <Plus size={14} />
                  إضافة ملاحظة
                </button>
              </div>

              <div className="project-note-list">
                {projectNotes.length ? (
                  projectNotes.map(
                    (note) => (
                      <div
                        className="project-note"
                        key={note.id}
                      >
                        <div className="note-avatar">
                          {getInitials(
                            note.user?.name ||
                              "MA"
                          )}
                        </div>

                        <div>
                          <div className="note-top">
                            <strong>
                              {note.user
                                ?.name ||
                                "مستخدم النظام"}
                            </strong>

                            <span>
                              ملاحظة
                            </span>
                          </div>

                          <small>
                            {formatDate(
                              note.created_at
                            )}
                          </small>

                          <p>
                            {note.note}
                          </p>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="project-empty-state">
                    لا توجد ملاحظات
                    على المشروع حتى
                    الآن.
                  </div>
                )}
              </div>
            </section>

            {/* ACTIVITY */}

            <section className="project-widget project-activity">
              <div className="project-widget-header">
                <h3>
                  سجل الأنشطة
                </h3>
              </div>

              <div className="project-timeline">
                {workflowHistory.length ? (
                  workflowHistory.map(
                    (activity) => (
                      <div
                        key={
                          activity.id
                        }
                        className="timeline-item"
                      >
                        <div className="timeline-icon purple">
                          <Send
                            size={15}
                          />
                        </div>

                        <div className="timeline-content">
                          <strong>
                            {activity.status === "returned"
                              ? "تم إرجاع"
                              : "تم تحويل"}{" "}
                            المشروع من{" "}
                            {stageNames[
                              activity
                                .from_stage
                            ] ||
                              activity.from_stage}{" "}
                            إلى{" "}
                            {stageNames[
                              activity
                                .to_stage
                            ] ||
                              activity.to_stage}
                          </strong>

                          <span>
                            {activity
                              .transferred_by
                              ?.name
                              ? `بواسطة ${activity.transferred_by.name}`
                              : "بواسطة النظام"}
                          </span>
                        </div>

                        <time>
                          {formatDate(
                            activity.transferred_at
                          )}
                        </time>
                      </div>
                    )
                  )
                ) : (
                  <div className="project-empty-state">
                    لا توجد عمليات
                    مسجلة حتى الآن.
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>


      {isReturnModalOpen && (
        <div
          onClick={closeReturnModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, 0.42)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.20)",
              border: "1px solid #edf0f5",
              overflow: "hidden",
              direction: "rtl",
            }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid #eef1f5",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  إرجاع المشروع للقسم السابق
                </div>

                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#7b8497",
                  }}
                >
                  {stageNames[project?.current_stage] || project?.current_stage}
                  {" ← "}
                  {stageNames[project?.previous_stage] ||
                    stageNames[
                      project?.current_stage === "closed"
                        ? "execution"
                        : project?.current_stage === "execution"
                        ? "finance"
                        : project?.current_stage === "finance"
                        ? "purchasing"
                        : project?.current_stage === "purchasing"
                        ? "pricing"
                        : project?.current_stage === "pricing"
                        ? "sales"
                        : project?.current_stage === "sales"
                        ? "crm"
                        : ""
                    ] ||
                    "القسم السابق"}
                </div>
              </div>

              <button
                type="button"
                onClick={closeReturnModal}
                disabled={isReturning}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  border: "1px solid #e6e9ef",
                  background: "#fff",
                  cursor: isReturning ? "not-allowed" : "pointer",
                  fontSize: "18px",
                  color: "#667085",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px" }}>
              <label
                style={{
                  display: "grid",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#475467",
                  }}
                >
                  سبب الإرجاع
                </span>

                <textarea
                  value={returnReason}
                  onChange={(e) => {
                    setReturnReason(e.target.value);
                    if (returnError) setReturnError("");
                  }}
                  placeholder="مثال: تعديل عرض السعر حسب طلب العميل"
                  rows={4}
                  autoFocus
                  style={{
                    width: "100%",
                    resize: "vertical",
                    minHeight: "105px",
                    border: `1px solid ${
                      returnError ? "#fda4af" : "#dfe3ec"
                    }`,
                    borderRadius: "12px",
                    padding: "12px 13px",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              {returnError && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    background: "#fff1f2",
                    color: "#be123c",
                    fontSize: "12px",
                    lineHeight: 1.6,
                  }}
                >
                  {returnError}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-start",
                  marginTop: "18px",
                }}
              >
                <button
                  type="button"
                  onClick={handleMoveToPreviousStage}
                  disabled={isReturning || !returnReason.trim()}
                  style={{
                    minHeight: "42px",
                    padding: "0 18px",
                    border: 0,
                    borderRadius: "10px",
                    background:
                      isReturning || !returnReason.trim()
                        ? "#cbd5e1"
                        : "#6757f5",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontWeight: 900,
                    cursor:
                      isReturning || !returnReason.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isReturning ? "جاري الإرجاع..." : "تأكيد الإرجاع"}
                </button>

                <button
                  type="button"
                  onClick={closeReturnModal}
                  disabled={isReturning}
                  style={{
                    minHeight: "42px",
                    padding: "0 18px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    background: "#fff",
                    color: "#475467",
                    fontFamily: "inherit",
                    fontWeight: 800,
                    cursor: isReturning ? "not-allowed" : "pointer",
                  }}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {quotationEditorOpen && (
        <div
          dir="rtl"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(15, 23, 42, .48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeQuotationEditor();
            }
          }}
        >
          <div
            style={{
              width: "min(1180px, 96vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "18px",
              boxShadow: "0 24px 70px rgba(15,23,42,.20)",
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: "20px" }}>
                  {editingQuotation
                    ? `تعديل عرض السعر V${editingQuotation.version || 1}`
                    : "إنشاء عرض سعر V1"}
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#8b93a7",
                    fontSize: "13px",
                  }}
                >
                  اختر المنتجات وحدد الكميات وأسعار البيع والخصم والضريبة.
                </p>
              </div>

              <button
                type="button"
                onClick={closeQuotationEditor}
                disabled={quotationBusy}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "9px 14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                إغلاق
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#667085" }}>
                  خصم إجمالي
                </span>
                <input
                  type="number"
                  min="0"
                  value={quotationForm.discount}
                  onChange={(e) =>
                    setQuotationForm((current) => ({
                      ...current,
                      discount: e.target.value,
                    }))
                  }
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    padding: "0 10px",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#667085" }}>
                  صالح حتى
                </span>
                <input
                  type="date"
                  value={quotationForm.valid_until}
                  onChange={(e) =>
                    setQuotationForm((current) => ({
                      ...current,
                      valid_until: e.target.value,
                    }))
                  }
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    padding: "0 10px",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#667085" }}>
                  ملاحظات العرض
                </span>
                <input
                  value={quotationForm.notes}
                  onChange={(e) =>
                    setQuotationForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="ملاحظات اختيارية"
                  style={{
                    minHeight: "42px",
                    border: "1px solid #dfe3ec",
                    borderRadius: "10px",
                    padding: "0 10px",
                  }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
              {quotationForm.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #eceef5",
                    borderRadius: "14px",
                    padding: "14px",
                    background: "#fbfcff",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2fr .7fr .9fr .9fr .75fr .75fr auto",
                      gap: "8px",
                      alignItems: "end",
                    }}
                  >
                    <label style={{ display: "grid", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#667085" }}>
                        المنتج
                      </span>
                      <select
                        value={item.product_id}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "product_id",
                            e.target.value
                          )
                        }
                        style={{
                          minHeight: "40px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 9px",
                          background: "#fff",
                        }}
                      >
                        <option value="">اختيار / بند يدوي</option>
                        {quotationProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} — {product.sku || "بدون SKU"}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={{ display: "grid", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#667085" }}>
                        الكمية
                      </span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        style={{
                          minHeight: "40px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 8px",
                        }}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#667085" }}>
                        التكلفة
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.cost_price}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "cost_price",
                            e.target.value
                          )
                        }
                        style={{
                          minHeight: "40px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 8px",
                        }}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#667085" }}>
                        سعر البيع
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "unit_price",
                            e.target.value
                          )
                        }
                        style={{
                          minHeight: "40px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 8px",
                        }}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#667085" }}>
                        خصم
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.discount}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "discount",
                            e.target.value
                          )
                        }
                        style={{
                          minHeight: "40px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 8px",
                        }}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "5px" }}>
                      <span style={{ fontSize: "11px", color: "#667085" }}>
                        ضريبة %
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.tax_rate}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "tax_rate",
                            e.target.value
                          )
                        }
                        style={{
                          minHeight: "40px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 8px",
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeQuotationItem(index)}
                      disabled={quotationForm.items.length === 1}
                      title="حذف البند"
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "9px",
                        border: "1px solid #fee2e2",
                        background: "#fff7f7",
                        color: "#dc2626",
                        cursor:
                          quotationForm.items.length === 1
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {!item.product_id && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr .7fr 2fr",
                        gap: "8px",
                        marginTop: "8px",
                      }}
                    >
                      <input
                        value={item.product_name}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "product_name",
                            e.target.value
                          )
                        }
                        placeholder="اسم البند"
                        style={{
                          minHeight: "38px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 9px",
                        }}
                      />
                      <input
                        value={item.sku}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "sku",
                            e.target.value
                          )
                        }
                        placeholder="SKU"
                        style={{
                          minHeight: "38px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 9px",
                        }}
                      />
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateQuotationItem(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="الوصف"
                        style={{
                          minHeight: "38px",
                          border: "1px solid #dfe3ec",
                          borderRadius: "9px",
                          padding: "0 9px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addQuotationItem}
              style={{
                marginTop: "12px",
                border: "1px dashed #a5b4fc",
                background: "#f5f7ff",
                color: "#4f46e5",
                borderRadius: "10px",
                padding: "10px 15px",
                fontFamily: "inherit",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <Plus size={15} style={{ marginLeft: "6px" }} />
              إضافة بند
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)",
                gap: "8px",
                marginTop: "18px",
              }}
            >
              {[
                ["الإجمالي قبل الضريبة", quotationPreview.subtotal],
                ["الضريبة", quotationPreview.tax],
                ["الخصم العام", Number(quotationForm.discount || 0)],
                ["الإجمالي النهائي", quotationPreview.total],
                ["الربح المتوقع", quotationPreview.profit],
                [
                  "هامش الربح",
                  `${quotationPreview.margin.toFixed(1)}%`,
                  true,
                ],
              ].map(([label, value, isPercent]) => (
                <div
                  key={label}
                  style={{
                    border: "1px solid #eceef5",
                    borderRadius: "11px",
                    padding: "12px",
                    background: "#fafbfe",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      color: "#8b93a7",
                      fontSize: "11px",
                    }}
                  >
                    {label}
                  </span>
                  <strong
                    style={{
                      display: "block",
                      marginTop: "5px",
                      fontSize: "14px",
                    }}
                  >
                    {isPercent ? value : formatMoney(value)}
                  </strong>
                </div>
              ))}
            </div>

            {quotationError && (
              <div
                style={{
                  marginTop: "14px",
                  background: "#fff1f2",
                  color: "#dc2626",
                  borderRadius: "10px",
                  padding: "11px 13px",
                }}
              >
                {quotationError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "18px",
              }}
            >
              <button
                type="button"
                onClick={closeQuotationEditor}
                disabled={quotationBusy}
                style={{
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  borderRadius: "10px",
                  padding: "11px 18px",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={saveQuotation}
                disabled={quotationBusy}
                style={{
                  border: 0,
                  background: "#6257ff",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "11px 20px",
                  fontFamily: "inherit",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {quotationBusy
                  ? "جاري الحفظ..."
                  : editingQuotation
                    ? "حفظ التعديلات"
                    : "إنشاء V1"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}