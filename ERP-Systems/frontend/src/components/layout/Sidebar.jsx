import {
  Home,
  Grid3X3,
  MessageSquare,
  Bell,
  Star,
  Users,
  TrendingUp,
  Package,
  FolderKanban,
  Settings,
  LogOut,
  FileText,
  ShoppingCart,
  Calculator,
  BadgeDollarSign,
  BarChart3,
  ReceiptText,
  Tags,
  BrainCircuit,
} from "lucide-react";

const mainMenu = [
  {
    id: "dashboard",
    name: "الرئيسية",
    icon: Home,
  },
  {
    id: "apps",
    name: "التطبيقات",
    icon: Grid3X3,
  },
  {
    id: "chat",
    name: "الدردشة",
    icon: MessageSquare,
    badge: 4,
  },
  {
    id: "notifications",
    name: "الإشعارات",
    icon: Bell,
    badge: 7,
  },
  {
    id: "favorites",
    name: "المفضلة",
    icon: Star,
  },
];

const quickApps = [
  {
    id: "crm",
    name: "CRM",
    icon: Users,
    color: "purple",
    stage: "crm",
  },

  {
    id: "sales",
    name: "المبيعات",
    icon: TrendingUp,
    color: "purple",
  },

  {
    id: "ai-sales",
    name: "AI Sales",
    icon: BrainCircuit,
    color: "purple",
  },

  {
    id: "pricing",
    name: "التسعير",
    icon: BadgeDollarSign,
    color: "orange",
    stage: "pricing",
  },

  {
    id: "price-list",
    name: "قائمة الأسعار",
    icon: Tags,
    color: "orange",
  },

  {
    id: "quotations",
    name: "عروض الأسعار",
    icon: ReceiptText,
    color: "purple",
  },

  {
    id: "invoices",
    name: "الفواتير",
    icon: FileText,
    color: "purple",
  },

  {
    id: "purchases",
    name: "المشتريات",
    icon: ShoppingCart,
    color: "cyan",
    stage: "purchasing",
  },

  {
    id: "inventory",
    name: "المخزون",
    icon: Package,
    color: "red",
  },

  {
    id: "projects",
    name: "المشاريع",
    icon: FolderKanban,
    color: "blue",
    stage: "all",
  },

  {
    id: "accounting",
    name: "المحاسبة",
    icon: Calculator,
    color: "teal",
    stage: "finance",
  },

  {
    id: "employees",
    name: "الموظفين",
    icon: Users,
    color: "purple",
  },

  {
    id: "reports",
    name: "التقارير",
    icon: BarChart3,
    color: "purple",
  },
];

export default function Sidebar({
  activeView = "dashboard",
  activeWorkOrderSource = null,
  onChangeView,
}) {
  const handleView = (id, options = {}) => {
    onChangeView?.(id, options);
  };

  const handleQuickApp = (item) => {
    // Sales
    if (item.id === "sales") {
      handleView("sales");
      return;
    }

    // AI Sales
    if (item.id === "ai-sales") {
      handleView("ai-sales");
      return;
    }

    // Pricing
    if (item.id === "pricing") {
      handleView("pricing");
      return;
    }

    // CRM / Purchasing / Projects / Accounting
    if (item.stage) {
      handleView("work-orders", {
        stage: item.stage,
        source: item.id,
      });

      return;
    }

    handleView(item.id);
  };

  const isQuickAppActive = (item) => {
    // Sales + all internal Sales pages
    if (item.id === "sales") {
      return (
        activeView === "sales" ||
        activeView.startsWith("sales-")
      );
    }

    // AI Sales + all internal AI Sales pages
    if (item.id === "ai-sales") {
      return (
        activeView === "ai-sales" ||
        activeView.startsWith("ai-sales-")
      );
    }

    // Pricing + all internal Pricing pages
    if (item.id === "pricing") {
      return (
        activeView === "pricing" ||
        activeView.startsWith("pricing-")
      );
    }

    // Existing Work Orders based modules
    if (item.stage) {
      return (
        activeView === "work-orders" &&
        activeWorkOrderSource === item.id
      );
    }

    return activeView === item.id;
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          M
        </div>

        <div className="brand-text">
          <strong>MASA</strong>
          <span>ERP</span>
        </div>
      </div>

      <nav className="main-navigation">
        {mainMenu.map((item) => {
          const Icon = item.icon;

          const isActive =
            activeView === item.id;

          return (
            <button
              type="button"
              key={item.id}
              className={`nav-item ${
                isActive ? "active" : ""
              }`}
              onClick={() =>
                handleView(item.id)
              }
            >
              <Icon
                size={20}
                strokeWidth={1.8}
              />

              <span>
                {item.name}
              </span>

              {item.badge && (
                <span className="nav-badge">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <section
        className="quick-apps-section"
        style={{
          overflowY: "auto",
          minHeight: 0,
          paddingBottom: "16px",
        }}
      >
        <p className="sidebar-label">
          التطبيقات السريعة
        </p>

        <div className="quick-apps-grid">
          {quickApps.map((item) => {
            const Icon = item.icon;

            const isActive =
              isQuickAppActive(item);

            return (
              <button
                type="button"
                className={`quick-app-card ${
                  isActive ? "active" : ""
                }`}
                key={item.id}
                onClick={() =>
                  handleQuickApp(item)
                }
              >
                <div
                  className={`quick-app-icon ${item.color}`}
                >
                  <Icon
                    size={21}
                    strokeWidth={1.8}
                  />
                </div>

                <span>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="sidebar-bottom">
        <button
          type="button"
          className={`nav-item settings-item ${
            activeView === "settings"
              ? "active"
              : ""
          }`}
          onClick={() =>
            handleView("settings")
          }
        >
          <Settings
            size={20}
            strokeWidth={1.8}
          />

          <span>
            الإعدادات
          </span>
        </button>

        <div className="company-card">
          <div className="company-icon">
            <FolderKanban
              size={20}
            />
          </div>

          <div className="company-info">
            <strong>
              شركة MASA للأنظمة
            </strong>

            <span>
              الشركة الرئيسية
            </span>
          </div>

          <LogOut
            size={17}
          />
        </div>
      </div>
    </aside>
  );
}