
import { Building2 } from "lucide-react";
import { useSalesContext } from "../../context/SalesContext";

export default function SalesBranchSelector() {
  const { branches, branchId, selectBranch, loadingBranches } = useSalesContext();

  return (
    <label className="sales-branch-selector">
      <Building2 size={15} />
      <select
        value={branchId}
        disabled={loadingBranches}
        onChange={(e) => selectBranch(e.target.value)}
      >
        <option value="">كل الفروع</option>
        {branches.map((branch) => (
          <option value={branch.id} key={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </label>
  );
}
