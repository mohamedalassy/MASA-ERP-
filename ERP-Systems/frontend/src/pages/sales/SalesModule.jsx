import SalesCommandCenter from "./SalesCommandCenter";
import SalesLeads from "./SalesLeads";
import SalesLeadDetails from "./SalesLeadDetails";
import SalesOpportunities from "./SalesOpportunities";
import SalesOpportunityDetails from "./SalesOpportunityDetails";
import SalesPipeline from "./SalesPipeline";
import SalesCustomers from "./SalesCustomers";
import SalesCustomer360 from "./SalesCustomer360";
import SalesActivities from "./SalesActivities";
import SalesQuotations from "./SalesQuotations";
import SalesNegotiations from "./SalesNegotiations";
import SalesOrders from "./SalesOrders";
import SalesContracts from "./SalesContracts";
import SalesTargets from "./SalesTargets";
import SalesCommissions from "./SalesCommissions";
import SalesForecast from "./SalesForecast";
import SalesDealHealth from "./SalesDealHealth";
import SalesRevenueLeakage from "./SalesRevenueLeakage";
import SalesCreditControl from "./SalesCreditControl";
import SalesProfitability from "./SalesProfitability";
import SalesRenewals from "./SalesRenewals";
import SalesReports from "./SalesReports";

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
