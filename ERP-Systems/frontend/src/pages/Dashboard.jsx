import {
  TrendingUp,
  CircleDollarSign,
  ReceiptText,
  FolderKanban,
  Boxes,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const performanceData = [
  { month: "مارس", sales: 62000, profit: 24000 },
  { month: "أبريل", sales: 91000, profit: 43000 },
  { month: "مايو", sales: 128000, profit: 76000 },
  { month: "يونيو", sales: 104000, profit: 51000 },
  { month: "يوليو", sales: 162000, profit: 92000 },
  { month: "أغسطس", sales: 245000, profit: 151000 },
];

const salesDistribution = [
  { name: "أنظمة مراقبة", value: 32 },
  { name: "شبكات", value: 26 },
  { name: "أنظمة إنذار", value: 18 },
  { name: "أجهزة حضور", value: 14 },
  { name: "أخرى", value: 10 },
];

const invoiceStatus = [
  { name: "مدفوعة", value: 92 },
  { name: "مستحقة", value: 18 },
  { name: "متأخرة", value: 8 },
  { name: "ملغاة", value: 38 },
];

const salesColors = [
  "#6657F5",
  "#22B779",
  "#F59F35",
  "#4F8DF7",
  "#A7A0F8",
];

const invoiceColors = [
  "#22B779",
  "#4F8DF7",
  "#F59F35",
  "#EF5F68",
];

const miniCharts = [
  [22, 35, 29, 42, 36, 51, 45, 62],
  [18, 24, 19, 31, 27, 39, 33, 48],
  [40, 33, 37, 29, 31, 24, 26, 20],
  [14, 18, 15, 22, 20, 26, 24, 31],
  [28, 25, 30, 22, 24, 21, 27, 34],
];

const stats = [
  {
    title: "إجمالي المبيعات",
    value: "245,000",
    unit: "ر.س",
    change: "+18.3%",
    note: "من الشهر الماضي",
    icon: TrendingUp,
    tone: "purple",
  },
  {
    title: "صافي الأرباح",
    value: "181,500",
    unit: "ر.س",
    change: "+12.5%",
    note: "هامش ربح 74.1%",
    icon: CircleDollarSign,
    tone: "green",
  },
  {
    title: "المستحقات",
    value: "45,230",
    unit: "ر.س",
    change: "12 فاتورة",
    note: "3 فواتير متأخرة",
    icon: ReceiptText,
    tone: "orange",
  },
  {
    title: "المشاريع النشطة",
    value: "18",
    unit: "مشروع",
    change: "+5",
    note: "مشاريع جديدة",
    icon: FolderKanban,
    tone: "blue",
  },
  {
    title: "قيمة المخزون",
    value: "328,400",
    unit: "ر.س",
    change: "8 أصناف",
    note: "تحتاج إعادة طلب",
    icon: Boxes,
    tone: "cyan",
  },
];

const invoices = [
  {
    id: "INV-2025-1048",
    customer: "شركة البناء الحديث",
    amount: "18,400",
    status: "متأخرة",
    className: "danger",
  },
  {
    id: "INV-2025-1047",
    customer: "مؤسسة الإبداع للمقاولات",
    amount: "9,200",
    status: "مدفوعة",
    className: "success",
  },
  {
    id: "INV-2025-1046",
    customer: "شركة المستقبل التجارية",
    amount: "24,150",
    status: "مستحقة",
    className: "warning",
  },
  {
    id: "INV-2025-1045",
    customer: "مجموعة النخبة",
    amount: "12,750",
    status: "مدفوعة",
    className: "success",
  },
];

const customers = [
  { name: "شركة البناء الحديث", value: "245,800", rank: 1 },
  { name: "مؤسسة الإبداع للمقاولات", value: "189,600", rank: 2 },
  { name: "شركة المستقبل التجارية", value: "156,300", rank: 3 },
  { name: "مجموعة النخبة", value: "98,400", rank: 4 },
  { name: "رؤية متقدمة", value: "76,900", rank: 5 },
];

const projects = [
  { name: "مشروع برج النخبة", progress: 78 },
  { name: "مجمع الياسمين", progress: 61 },
  { name: "المبنى الإداري", progress: 43 },
  { name: "مركز البيانات", progress: 28 },
];

const activities = [
  {
    icon: CheckCircle2,
    title: "تم اعتماد عرض السعر Q-1048",
    text: "شركة البناء الحديث",
    tone: "green",
  },
  {
    icon: ReceiptText,
    title: "تم إنشاء فاتورة INV-2025-1047",
    text: "مؤسسة الإبداع للمقاولات",
    tone: "purple",
  },
  {
    icon: AlertTriangle,
    title: "منتج وصل للحد الأدنى",
    text: "كاميرا IP خارجية",
    tone: "orange",
  },
  {
    icon: Clock3,
    title: "تم تحديث حالة مشروع",
    text: "مشروع مجمع الياسمين",
    tone: "blue",
  },
];

function MiniChart({ data, tone }) {
  const strokeMap = {
    purple: "#6657f5",
    green: "#22b779",
    orange: "#f59f35",
    blue: "#4f7df3",
    cyan: "#20b6c7",
  };

  return (
    <svg
      viewBox="0 0 120 38"
      className="mini-chart"
    >
      <polyline
        fill="none"
        stroke={strokeMap[tone]}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={data
          .map((value, index) => {
            const x =
              (index / (data.length - 1)) * 118;

            const y =
              36 - ((value - 10) / 55) * 32;

            return `${x},${y}`;
          })
          .join(" ")}
      />
    </svg>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <span className="dashboard-date">
            الخميس، 27 أغسطس 2026
          </span>

          <h1>
            صباح الخير، محمد 👋
          </h1>

          <p>
            إليك ملخص أداء شركتك وما يحتاج انتباهك اليوم.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-customize"
        >
          تخصيص لوحة التحكم
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="dashboard-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <article
              className="dashboard-stat-card"
              key={stat.title}
            >
              <div className="stat-card-head">
                <div
                  className={`dashboard-stat-icon ${stat.tone}`}
                >
                  <Icon
                    size={20}
                    strokeWidth={1.8}
                  />
                </div>

                <span>
                  {stat.title}
                </span>
              </div>

              <div className="stat-card-main">
                <div>
                  <strong>
                    {stat.value}
                  </strong>

                  <span>
                    {stat.unit}
                  </span>
                </div>

                <MiniChart
                  data={miniCharts[index]}
                  tone={stat.tone}
                />
              </div>

              <div className="stat-card-foot">
                <b className={stat.tone}>
                  {stat.change}
                </b>

                <span>
                  {stat.note}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* MAIN CHARTS */}
      <div className="dashboard-charts-grid">

        {/* SALES DISTRIBUTION */}
        <article className="dashboard-widget donut-widget">
          <div className="widget-header">
            <div>
              <h3>
                توزيع المبيعات حسب الفئة
              </h3>

              <span>
                هذه السنة
              </span>
            </div>
          </div>

          <div className="donut-layout">

            <div className="donut-chart-wrap">
              <ResponsiveContainer
                width="100%"
                height={220}
              >
                <PieChart>
                  <Pie
                    data={salesDistribution}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {salesDistribution.map(
                      (entry, index) => (
                        <Cell
                          key={`sales-${index}`}
                          fill={salesColors[index]}
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center">
                <strong>
                  1,245,800
                </strong>

                <span>
                  ر.س
                </span>
              </div>
            </div>

            <div className="chart-legend-list">
              {salesDistribution.map(
                (item, index) => (
                  <div key={item.name}>
                    <i
                      className="legend-color"
                      style={{
                        background:
                          salesColors[index],
                      }}
                    />

                    <span>
                      {item.name}
                    </span>

                    <b>
                      {item.value}%
                    </b>
                  </div>
                )
              )}
            </div>
          </div>
        </article>

        {/* SALES / PROFIT CHART */}
        <article className="dashboard-widget main-sales-chart">

          <div className="widget-header">
            <div>
              <h3>
                أداء المبيعات والأرباح
              </h3>

              <span>
                آخر 6 أشهر
              </span>
            </div>

            <div className="chart-labels">
              <span>
                <i className="sales-dot" />
                المبيعات
              </span>

              <span>
                <i className="profit-dot" />
                الأرباح
              </span>
            </div>
          </div>

          <div className="main-chart-wrap">
            <ResponsiveContainer
              width="100%"
              height={260}
            >
              <LineChart
                data={performanceData}
                margin={{
                  top: 8,
                  right: 8,
                  left: 4,
                  bottom: 0,
                }}
              >
                <CartesianGrid
                  stroke="#ECEEF3"
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#8F95A3",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tick={{
                    fill: "#8F95A3",
                    fontSize: 10,
                  }}
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#6657F5"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#ffffff",
                    stroke: "#6657F5",
                    strokeWidth: 3,
                  }}
                  activeDot={{
                    r: 6,
                    fill: "#6657F5",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#22B779"
                  strokeWidth={2.5}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#22B779",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#22B779",
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* INVOICE STATUS */}
        <article className="dashboard-widget invoice-status-widget">

          <div className="widget-header">
            <div>
              <h3>
                حالة الفواتير
              </h3>

              <span>
                كل الفواتير
              </span>
            </div>
          </div>

          <div className="invoice-donut">

            <div className="donut-chart-wrap small">
              <ResponsiveContainer
                width="100%"
                height={190}
              >
                <PieChart>
                  <Pie
                    data={invoiceStatus}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {invoiceStatus.map(
                      (entry, index) => (
                        <Cell
                          key={`invoice-${index}`}
                          fill={invoiceColors[index]}
                          stroke="#ffffff"
                          strokeWidth={3}
                        />
                      )
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="donut-center small">
                <strong>
                  156
                </strong>

                <span>
                  فاتورة
                </span>
              </div>
            </div>

            <div className="invoice-status-list">
              {invoiceStatus.map(
                (item, index) => (
                  <div key={item.name}>
                    <i
                      className="legend-color"
                      style={{
                        background:
                          invoiceColors[index],
                      }}
                    />

                    <span>
                      {item.name}
                    </span>

                    <b>
                      {item.value}
                    </b>
                  </div>
                )
              )}
            </div>

          </div>
        </article>

      </div>

      {/* BOTTOM GRID */}
      <div className="dashboard-bottom-grid">

        {/* CUSTOMERS */}
        <article className="dashboard-widget customers-widget">

          <div className="widget-header">
            <div>
              <h3>
                أفضل العملاء
              </h3>

              <span>
                هذه السنة
              </span>
            </div>
          </div>

          <div className="ranking-list">
            {customers.map((customer) => (
              <div key={customer.name}>

                <span
                  className={`rank rank-${customer.rank}`}
                >
                  {customer.rank}
                </span>

                <strong>
                  {customer.name}
                </strong>

                <b>
                  {customer.value} ر.س
                </b>

              </div>
            ))}
          </div>

        </article>

        {/* INVOICES */}
        <article className="dashboard-widget invoices-widget">

          <div className="widget-header">
            <div>
              <h3>
                آخر الفواتير
              </h3>

              <span>
                أحدث المعاملات
              </span>
            </div>

            <button
              type="button"
              className="widget-link"
            >
              عرض الكل
              <ChevronLeft size={14} />
            </button>
          </div>

          <div className="invoice-table">

            <div className="invoice-table-head">
              <span>
                رقم الفاتورة
              </span>

              <span>
                العميل
              </span>

              <span>
                المبلغ
              </span>

              <span>
                الحالة
              </span>
            </div>

            {invoices.map((invoice) => (
              <div
                className="invoice-table-row"
                key={invoice.id}
              >
                <span>
                  {invoice.id}
                </span>

                <span>
                  {invoice.customer}
                </span>

                <b>
                  {invoice.amount} ر.س
                </b>

                <span
                  className={`invoice-state ${invoice.className}`}
                >
                  {invoice.status}
                </span>
              </div>
            ))}

          </div>
        </article>

        {/* PROJECTS */}
        <article className="dashboard-widget projects-widget">

          <div className="widget-header">
            <div>
              <h3>
                المشاريع النشطة
              </h3>

              <span>
                متابعة التنفيذ
              </span>
            </div>
          </div>

          <div className="dashboard-project-list">
            {projects.map((project) => (
              <div key={project.name}>

                <div className="project-title-row">
                  <strong>
                    {project.name}
                  </strong>

                  <span>
                    {project.progress}%
                  </span>
                </div>

                <div className="project-progress">
                  <div
                    style={{
                      width:
                        `${project.progress}%`,
                    }}
                  />
                </div>

              </div>
            ))}
          </div>

        </article>

        {/* ACTIVITY */}
        <article className="dashboard-widget activity-widget">

          <div className="widget-header">
            <div>
              <h3>
                آخر الأنشطة
              </h3>

              <span>
                آخر تحديثات النظام
              </span>
            </div>
          </div>

          <div className="activity-feed">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <div key={activity.title}>

                  <div
                    className={`activity-feed-icon ${activity.tone}`}
                  >
                    <Icon size={16} />
                  </div>

                  <div>
                    <strong>
                      {activity.title}
                    </strong>

                    <span>
                      {activity.text}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </article>

      </div>
    </div>
  );
}
