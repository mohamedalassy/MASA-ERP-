import FinanceDashboard from "./FinanceDashboard";
import ChartOfAccounts from "./ChartOfAccounts";
import JournalEntries from "./JournalEntries";
import GeneralLedger from "./GeneralLedger";
import CollectionsCenter from "./CollectionsCenter";
import FinanceSuppliers from "./FinanceSuppliers";
import FinanceBanks from "./FinanceBanks";
import FinanceCostCenters from "./FinanceCostCenters";
import FinanceCustomers from "./FinanceCustomers";
import ProjectFinancialCenter from "./ProjectFinancialCenter";
import SupplierInvoices from "./SupplierInvoices";
import TaxInvoiceCenter from "./TaxInvoiceCenter";
import TaxInvoiceDetails from "./TaxInvoiceDetails";
import TaxInvoiceCreate from "./TaxInvoiceCreate";
import VatCenter from "./VatCenter";
import BankReconciliation from "./BankReconciliation";
import IncomeStatement from "./IncomeStatement";
import BalanceSheet from "./BalanceSheet";
import CashFlowStatement from "./CashFlowStatement";
import FinanceReports from "./FinanceReports";
import FixedAssets from "./FixedAssets";
import CompanyTaxProfile from "./CompanyTaxProfile";
import CustomerTaxProfiles from "./CustomerTaxProfiles";

import "../../styles/accounting-core.css";
import "../../styles/finance-enterprise.css";

export const isFinanceView = (view = "") =>
  view === "finance" || view === "accounting" || view.startsWith("finance-");

export default function FinanceRouter({ activeView = "finance", onNavigate, options = {} }) {
  const nav = { onNavigate, onChangeView: onNavigate };

  switch (activeView) {
    case "finance":
    case "accounting": return <FinanceDashboard {...nav} />;
    case "finance-chart-accounts": return <ChartOfAccounts {...nav} />;
    case "finance-journal": return <JournalEntries {...nav} />;
    case "finance-general-ledger": return <GeneralLedger {...nav} />;
    case "finance-collections-center": return <CollectionsCenter {...nav} />;
    case "finance-suppliers": return <FinanceSuppliers {...nav} />;
    case "finance-banks": return <FinanceBanks {...nav} />;
    case "finance-cost-centers": return <FinanceCostCenters {...nav} />;
    case "finance-customers": return <FinanceCustomers {...nav} />;
    case "finance-projects":
    case "finance-project-center": return <ProjectFinancialCenter {...nav} projectId={options.projectId} />;
    case "finance-supplier-invoices": return <SupplierInvoices {...nav} />;
    case "finance-tax-invoices": return <TaxInvoiceCenter {...nav} />;
    case "finance-tax-create": return <TaxInvoiceCreate {...nav} viewData={options} />;
    case "finance-tax-details":
    case "finance-tax-invoice-details":
      return <TaxInvoiceDetails {...nav} taxInvoiceId={options.taxInvoiceId ?? options.invoiceId ?? options.id} viewData={options} />;
    case "finance-vat-center": return <VatCenter {...nav} />;
    case "finance-bank-reconciliation": return <BankReconciliation {...nav} />;
    case "finance-fixed-assets": return <FixedAssets {...nav} />;
    case "finance-tax-profile": return <CompanyTaxProfile {...nav} />;
    case "finance-customer-tax-profile": return <CustomerTaxProfiles {...nav} />;
    case "finance-income-statement": return <IncomeStatement {...nav} />;
    case "finance-balance-sheet": return <BalanceSheet {...nav} />;
    case "finance-cash-flow": return <CashFlowStatement {...nav} />;
    case "finance-reports": return <FinanceReports {...nav} />;
    default: return <FinanceDashboard {...nav} />;
  }
}
