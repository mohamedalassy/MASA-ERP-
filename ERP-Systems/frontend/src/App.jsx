import { useState } from "react";

import ProductAlternatives from "./pages/ProductAlternatives";
import PricingPackages from "./pages/PricingPackages";
import SuggestedPriceCalculator from "./pages/SuggestedPriceCalculator";
import PricingRules from "./pages/PricingRules";
import PriceHistory from "./pages/PriceHistory";
import CostingEngine from "./pages/CostingEngine";
import PricingReports from "./pages/PricingReports";
import CreateProject from "./pages/CreateProject";
import Customers from "./pages/customers/Customers";
import CreateCustomer from "./pages/customers/CreateCustomer";
import Customer360 from "./pages/customers/Customer360";
import AISalesRouter from "./pages/ai-sales/AISalesRouter";

/* =========================
   MASA Finance
========================= */
import FinanceRouter, {
  isFinanceView,
} from "./pages/finance/FinanceRouter";

/* =========================
   MASA People V2
========================= */
import PeopleRouter, {
  isPeopleV2View,
} from "./pages/hr-v2/PeopleRouter";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import AppLauncher from "./components/apps/AppLauncher";
import ChatPanel from "./components/chat/ChatPanel";

import Dashboard from "./pages/Dashboard";
import WorkOrders from "./pages/WorkOrders";
import ProjectDetails from "./pages/ProjectDetails";
import PurchaseOrders from "./pages/PurchaseOrders";
import PurchaseOrderDetails from "./pages/PurchaseOrderDetails";
import Inventory from "./pages/Inventory";
import Quotations from "./pages/Quotations";
import PriceList from "./pages/PriceList";
import PricingDashboard from "./pages/PricingDashboard";
import QuotationBuilder from "./pages/QuotationBuilder";
import SupplierPrices from "./pages/SupplierPrices";
import PricingApprovals from "./pages/PricingApprovals";

/* =========================
   Sales
========================= */
import SalesModule, {
  isSalesView,
} from "./pages/sales/SalesModule";

// Keep the existing quotation builder page.
// It is outside SalesModule so the current quotation workflow is not broken.
import SalesCreateQuotation from "./pages/sales/SalesCreateQuotation";

import "./styles/master.css";
import "./styles/sales-premium.css";

function App() {
  const [activeView, setActiveView] = useState("dashboard");

  const [workOrderStage, setWorkOrderStage] = useState("all");
  const [activeWorkOrderSource, setActiveWorkOrderSource] = useState(null);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const [pendingPackageData, setPendingPackageData] = useState(null);
  const [packageHandoffToken, setPackageHandoffToken] = useState(0);

  /* =========================
     HR V2
  ========================= */

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  /* =========================
     Finance
  ========================= */

  const [financeOptions, setFinanceOptions] = useState({});

  /* =========================
     Sales
  ========================= */

  const [selectedSalesLeadId, setSelectedSalesLeadId] = useState(null);

  const handleChangeView = (view, options = {}) => {
    /*
    |--------------------------------------------------------------------------
    | Work Orders
    |--------------------------------------------------------------------------
    */

    if (view === "work-orders") {
      setWorkOrderStage(options.stage || "all");
      setActiveWorkOrderSource(options.source || null);
      setActiveView("work-orders");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Customers
    |--------------------------------------------------------------------------
    */

    if (view === "customers") {
      setActiveWorkOrderSource(null);
      setActiveView("customers");
      return;
    }

    if (view === "customer-create") {
      setActiveWorkOrderSource(null);
      setActiveView("customer-create");
      return;
    }

    if (view === "customer-360") {
      setSelectedCustomerId(options.customerId ?? options.id ?? null);
      setActiveWorkOrderSource(null);
      setActiveView("customer-360");
      return;
    }

    if (view === "project-create") {
      if (options.customerId) {
        setSelectedCustomerId(options.customerId);
      }
      setSelectedProjectId(null);
      setActiveWorkOrderSource(null);
      setActiveView("project-create");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Pricing Builder
    |--------------------------------------------------------------------------
    */

    if (view === "pricing-builder") {
      setSelectedQuotationId(options.quotationId || null);
      setPendingPackageData(options.packageData || null);

      if (options.packageData) {
        setPackageHandoffToken((current) => current + 1);
      }

      if (options.projectId) {
        setSelectedProjectId(options.projectId);
      }

      setActiveWorkOrderSource(null);
      setActiveView("pricing-builder");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | HR Employee 360
    |--------------------------------------------------------------------------
    */

    if (view === "hr-v2-employee-360") {
      setSelectedEmployeeId(
        options.employeeId ??
          options.id ??
          null
      );

      setActiveWorkOrderSource(null);
      setActiveView("hr-v2-employee-360");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | MASA Finance
    |--------------------------------------------------------------------------
    */

    if (isFinanceView(view)) {
      setFinanceOptions(options || {});
      setActiveWorkOrderSource(null);
      setActiveView(view);
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Sales Records
    |--------------------------------------------------------------------------
    */

    if (view === "sales-lead-details") {
      setSelectedSalesLeadId(
        options.leadId ??
          options.id ??
          null
      );

      setActiveWorkOrderSource(null);
      setActiveView("sales-lead-details");
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Default Navigation
    |--------------------------------------------------------------------------
    */

    setActiveWorkOrderSource(null);
    setActiveView(view);
  };

  const handleOpenProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView("project");
  };

  const handleCreateProject = () => {
    setSelectedProjectId(null);
    setActiveView("project-create");
  };

  const handleProjectCreated = (project) => {
    if (!project?.id) return;
    setSelectedProjectId(project.id);
    setActiveView("project");
  };

  const handleCustomerCreated = (customer) => {
    if (!customer?.id) return;
    setSelectedCustomerId(customer.id);
    setActiveView("customer-360");
  };

  const handleBackToCustomers = () => {
    setActiveView("customers");
  };

  const handleBackToWorkOrders = () => {
    setActiveView("work-orders");
  };

  const handleOpenPurchases = () => {
    setActiveView("purchase-orders");
  };

  const handleBackToProject = () => {
    setActiveView("project");
  };

  const handleOpenPurchaseOrder = (purchaseOrderId) => {
    setSelectedPurchaseOrderId(purchaseOrderId);
    setActiveView("purchase-order-details");
  };

  const handleBackToPurchaseOrders = () => {
    setActiveView("purchase-orders");
  };

  return (
    <div className="erp-shell" dir="rtl">
      <Sidebar
        activeView={activeView}
        activeWorkOrderSource={activeWorkOrderSource}
        onChangeView={handleChangeView}
      />

      <main className="erp-main">
        <Topbar />

        <div className="erp-content">

          {/* =========================
              Dashboard
          ========================= */}

          {activeView === "dashboard" && (
            <Dashboard onChangeView={handleChangeView} />
          )}

          {/* =========================
              MASA Finance
          ========================= */}

          {isFinanceView(activeView) && (
            <FinanceRouter
              activeView={activeView}
              onNavigate={handleChangeView}
              options={financeOptions}
            />
          )}

          {/* =========================
              MASA People V2
          ========================= */}

          {isPeopleV2View(activeView) && (
            <PeopleRouter
              activeView={activeView}
              onNavigate={handleChangeView}
              employeeId={selectedEmployeeId}
            />
          )}

          {/* =========================
              Sales
          ========================= */}

          {isSalesView(activeView) && (
            <SalesModule
              activeView={activeView}
              onNavigate={handleChangeView}
              selectedLeadId={selectedSalesLeadId}
            />
          )}

          {/* Existing quotation creation workflow */}
          {activeView === "sales-create-quotation" && (
            <SalesCreateQuotation
              onNavigate={handleChangeView}
            />
          )}

          {/* =========================
              AI Sales
          ========================= */}

          {activeView.startsWith("ai-sales") && (
            <AISalesRouter
              activeView={activeView}
              onChangeView={handleChangeView}
            />
          )}

          {/* =========================
              Pricing
          ========================= */}

          {activeView === "pricing" && (
            <PricingDashboard onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-rules" && (
            <PricingRules onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-calculator" && (
            <SuggestedPriceCalculator onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-packages" && (
            <PricingPackages onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-alternatives" && (
            <ProductAlternatives onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-builder" && (
            <QuotationBuilder
              key={`pricing-builder-${packageHandoffToken}-${selectedQuotationId || "new"}`}
              onNavigate={handleChangeView}
              initialProjectId={selectedProjectId}
              initialQuotationId={selectedQuotationId}
              initialPackageData={pendingPackageData}
            />
          )}

          {activeView === "pricing-reports" && (
            <PricingReports onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-suppliers" && (
            <SupplierPrices onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-history" && (
            <PriceHistory onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-costing" && (
            <CostingEngine onNavigate={handleChangeView} />
          )}

          {activeView === "pricing-approvals" && (
            <PricingApprovals onNavigate={handleChangeView} />
          )}

          {/* =========================
              Apps / Chat
          ========================= */}

          {activeView === "apps" && (
            <AppLauncher onChangeView={handleChangeView} />
          )}

          {activeView === "chat" && (
            <ChatPanel />
          )}

          {/* =========================
              Inventory / Quotations
          ========================= */}

          {activeView === "inventory" && (
            <Inventory />
          )}

          {activeView === "price-list" && (
            <PriceList />
          )}

          {activeView === "quotations" && (
            <Quotations onOpenProject={handleOpenProject} />
          )}

          {/* =========================
              Customers
          ========================= */}

          {activeView === "customers" && (
            <Customers onNavigate={handleChangeView} />
          )}

          {activeView === "customer-create" && (
            <CreateCustomer
              onBack={handleBackToCustomers}
              onCreated={handleCustomerCreated}
            />
          )}

          {activeView === "customer-360" && (
            <Customer360
              customerId={selectedCustomerId}
              onBack={handleBackToCustomers}
              onNavigate={handleChangeView}
            />
          )}

          {/* =========================
              Work Orders
          ========================= */}

          {activeView === "work-orders" && (
            <WorkOrders
              stage={workOrderStage}
              onOpenProject={handleOpenProject}
              onCreateProject={handleCreateProject}
            />
          )}

          {/* =========================
              Project
          ========================= */}

          {activeView === "project-create" && (
            <CreateProject
              onBack={handleBackToWorkOrders}
              onCreated={handleProjectCreated}
            />
          )}

          {activeView === "project" && (
            <ProjectDetails
              projectId={selectedProjectId}
              onBack={handleBackToWorkOrders}
              onOpenPurchases={handleOpenPurchases}
              onNavigate={handleChangeView}
            />
          )}

          {/* =========================
              Purchase Orders
          ========================= */}

          {activeView === "purchase-orders" && (
            <PurchaseOrders
              projectId={selectedProjectId || 1}
              onBack={handleBackToProject}
              onOpenPurchaseOrder={handleOpenPurchaseOrder}
            />
          )}

          {activeView === "purchase-order-details" && (
            <PurchaseOrderDetails
              purchaseOrderId={selectedPurchaseOrderId}
              onBack={handleBackToPurchaseOrders}
              onOpenPurchaseOrder={handleOpenPurchaseOrder}
            />
          )}

          {/* =========================
              Placeholder Pages
          ========================= */}

          {activeView === "notifications" && (
            <div className="placeholder-page">
              <h2>الإشعارات</h2>
            </div>
          )}

          {activeView === "favorites" && (
            <div className="placeholder-page">
              <h2>المفضلة</h2>
            </div>
          )}

          {activeView === "invoices" && (
            <div className="placeholder-page">
              <h2>الفواتير</h2>
            </div>
          )}

          {activeView === "reports" && (
            <div className="placeholder-page">
              <h2>التقارير</h2>
            </div>
          )}

          {activeView === "settings" && (
            <div className="placeholder-page">
              <h2>الإعدادات</h2>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;