import { useState } from "react";
import ProductAlternatives from "./pages/ProductAlternatives";
import PricingPackages from "./pages/PricingPackages";
import SuggestedPriceCalculator from "./pages/SuggestedPriceCalculator";
import PricingRules from "./pages/PricingRules";
import PriceHistory from "./pages/PriceHistory";
import CostingEngine from "./pages/CostingEngine";
import PricingReports from "./pages/PricingReports";

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

import "./styles/master.css";

function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [workOrderStage, setWorkOrderStage] = useState("all");
  const [activeWorkOrderSource, setActiveWorkOrderSource] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [pendingPackageData, setPendingPackageData] = useState(null);
  const [packageHandoffToken, setPackageHandoffToken] = useState(0);

  const handleChangeView = (view, options = {}) => {
    if (view === "work-orders") {
      setWorkOrderStage(options.stage || "all");
      setActiveWorkOrderSource(options.source || null);
      setActiveView("work-orders");
      return;
    }

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

    setActiveWorkOrderSource(null);
    setActiveView(view);
  };

  const handleOpenProject = (projectId) => {
    setSelectedProjectId(projectId);
    setActiveView("project");
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

  const pricingPlaceholderTitles = {
    
    
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
          {activeView === "dashboard" && (
            <Dashboard onChangeView={handleChangeView} />
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

          {activeView === "apps" && (
            <AppLauncher onChangeView={handleChangeView} />
          )}

          {activeView === "chat" && <ChatPanel />}

          {activeView === "pricing" && (
            <PricingDashboard onNavigate={handleChangeView} />
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

          {activeView === "inventory" && <Inventory />}

          {activeView === "price-list" && <PriceList />}

          {activeView === "quotations" && (
            <Quotations onOpenProject={handleOpenProject} />
          )}

          {activeView === "work-orders" && (
            <WorkOrders
              stage={workOrderStage}
              onOpenProject={handleOpenProject}
            />
          )}

          {activeView === "project" && (
            <ProjectDetails
              projectId={selectedProjectId || 1}
              onBack={handleBackToWorkOrders}
              onOpenPurchases={handleOpenPurchases}
              onNavigate={handleChangeView}
            />
          )}

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

          {pricingPlaceholderTitles[activeView] && (
            <div
              className="placeholder-page"
              style={{
                background: "#fff",
                border: "1px solid #e9ebf2",
                borderRadius: 18,
                padding: 28,
              }}
            >
              <div
                style={{
                  color: "#6b5bf5",
                  fontWeight: 800,
                  fontSize: 11,
                  marginBottom: 7,
                }}
              >
                مركز التسعير
              </div>

              <h2 style={{ marginTop: 0 }}>
                {pricingPlaceholderTitles[activeView]}
              </h2>

              <p style={{ color: "#939aaa" }}>
                تم تجهيز المسار داخل منظومة التسعير، وسيتم بناء تفاصيل هذه
                الوحدة في المرحلة التالية.
              </p>

              <button
                type="button"
                onClick={() => handleChangeView("pricing")}
                style={{
                  border: 0,
                  background: "#6657f5",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontWeight: 800,
                }}
              >
                العودة للوحة التسعير
              </button>
            </div>
          )}

          {activeView === "notifications" && (
            <div className="placeholder-page">
              <h2>الإشعارات</h2>
              <p>سيتم بناء مركز الإشعارات هنا.</p>
            </div>
          )}

          {activeView === "favorites" && (
            <div className="placeholder-page">
              <h2>المفضلة</h2>
              <p>التطبيقات والصفحات المفضلة ستظهر هنا.</p>
            </div>
          )}

          {activeView === "sales" && (
            <div className="placeholder-page">
              <h2>المبيعات</h2>
            </div>
          )}

          {activeView === "invoices" && (
            <div className="placeholder-page">
              <h2>الفواتير</h2>
            </div>
          )}

          {activeView === "employees" && (
            <div className="placeholder-page">
              <h2>الموظفين</h2>
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
