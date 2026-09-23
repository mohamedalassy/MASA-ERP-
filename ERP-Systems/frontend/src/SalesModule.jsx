import SalesCommandCenter from "./pages/SalesCommandCenter";
import SalesLeads from "./pages/SalesLeads";
import SalesLeadDetails from "./pages/SalesLeadDetails";
import SalesOpportunities from "./pages/SalesOpportunities";
import SalesOpportunityDetails from "./pages/SalesOpportunityDetails";
import SalesPipeline from "./pages/SalesPipeline";
import SalesCustomers from "./pages/SalesCustomers";
import SalesCustomer360 from "./pages/SalesCustomer360";
import SalesActivities from "./pages/SalesActivities";
import SalesQuotations from "./pages/SalesQuotations";
import SalesNegotiations from "./pages/SalesNegotiations";
import SalesOrders from "./pages/SalesOrders";
import SalesContracts from "./pages/SalesContracts";
import SalesTargets from "./pages/SalesTargets";
import SalesCommissions from "./pages/SalesCommissions";
import SalesForecast from "./pages/SalesForecast";
import SalesDealHealth from "./pages/SalesDealHealth";
import SalesRevenueLeakage from "./pages/SalesRevenueLeakage";
import SalesCreditControl from "./pages/SalesCreditControl";
import SalesProfitability from "./pages/SalesProfitability";
import SalesRenewals from "./pages/SalesRenewals";
import SalesReports from "./pages/SalesReports";

const views={
sales:SalesCommandCenter,
"sales-leads":SalesLeads,
"sales-lead-details":SalesLeadDetails,
"sales-opportunities":SalesOpportunities,
"sales-opportunity-details":SalesOpportunityDetails,
"sales-pipeline":SalesPipeline,
"sales-customers":SalesCustomers,
"sales-customer-360":SalesCustomer360,
"sales-activities":SalesActivities,
"sales-quotations":SalesQuotations,
"sales-negotiations":SalesNegotiations,
"sales-orders":SalesOrders,
"sales-contracts":SalesContracts,
"sales-targets":SalesTargets,
"sales-commissions":SalesCommissions,
"sales-forecast":SalesForecast,
"sales-deal-health":SalesDealHealth,
"sales-leakage":SalesRevenueLeakage,
"sales-credit":SalesCreditControl,
"sales-profitability":SalesProfitability,
"sales-renewals":SalesRenewals,
"sales-reports":SalesReports,
};
export const isSalesView=(view="")=>Boolean(views[view]);
export default function SalesModule({activeView="sales",onNavigate}){const Page=views[activeView]||SalesCommandCenter;return <Page activeView={activeView} onNavigate={onNavigate}/>;}
