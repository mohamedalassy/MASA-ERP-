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
import VatCenter from "./VatCenter";
import BankReconciliation from "./BankReconciliation";
import IncomeStatement from "./IncomeStatement";
import BalanceSheet from "./BalanceSheet";
import CashFlowStatement from "./CashFlowStatement";
import FinanceReports from "./FinanceReports";

export const isFinanceView = (view = "") =>
  view === "finance" || view.startsWith("finance-");

export default function FinanceRouter({
  activeView = "finance",
  onNavigate,
  options = {},
}) {
  switch (activeView) {
    case "finance":
      return <FinanceDashboard onNavigate={onNavigate} />;

    case "finance-chart-accounts":
      return <ChartOfAccounts onNavigate={onNavigate} />;

    case "finance-journal":
      return <JournalEntries onNavigate={onNavigate} />;

    case "finance-general-ledger":
      return <GeneralLedger onNavigate={onNavigate} />;

    case "finance-collections-center":
      return <CollectionsCenter onNavigate={onNavigate} />;

    case "finance-suppliers":
      return <FinanceSuppliers onNavigate={onNavigate} />;

    case "finance-banks":
      return <FinanceBanks onNavigate={onNavigate} />;

    case "finance-cost-centers":
      return <FinanceCostCenters onNavigate={onNavigate} />;

    case "finance-customers":
      return <FinanceCustomers onNavigate={onNavigate} />;

    case "finance-projects":
      return (
        <ProjectFinancialCenter
          onNavigate={onNavigate}
          projectId={options.projectId}
        />
      );

    case "finance-supplier-invoices":
      return <SupplierInvoices onNavigate={onNavigate} />;

    case "finance-tax-invoices":
      return <TaxInvoiceCenter onNavigate={onNavigate} />;

    case "finance-tax-invoice-details":
      return (
        <TaxInvoiceDetails
          onNavigate={onNavigate}
          invoiceId={options.invoiceId ?? options.id}
        />
      );

    case "finance-vat-center":
      return <VatCenter onNavigate={onNavigate} />;

    case "finance-bank-reconciliation":
      return <BankReconciliation onNavigate={onNavigate} />;

    case "finance-income-statement":
      return <IncomeStatement onNavigate={onNavigate} />;

    case "finance-balance-sheet":
      return <BalanceSheet onNavigate={onNavigate} />;

    case "finance-cash-flow":
      return <CashFlowStatement onNavigate={onNavigate} />;

    case "finance-reports":
      return <FinanceReports onNavigate={onNavigate} />;

    default:
      return <FinanceDashboard onNavigate={onNavigate} />;
  }
}