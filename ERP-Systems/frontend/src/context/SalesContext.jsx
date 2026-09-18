
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { salesApi, unwrap } from "../lib/salesApi";

const SalesContext = createContext(null);

export function SalesProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(
    () => localStorage.getItem("masa_sales_branch_id") || ""
  );
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    let alive = true;

    salesApi
      .get("/branches")
      .then((payload) => {
        if (!alive) return;
        const rows = unwrap(payload) || [];
        setBranches(rows);

        if (!branchId && rows.length === 1) {
          const id = String(rows[0].id);
          setBranchId(id);
          localStorage.setItem("masa_sales_branch_id", id);
        }
      })
      .catch(() => {
        if (alive) setBranches([]);
      })
      .finally(() => {
        if (alive) setLoadingBranches(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const selectBranch = (value) => {
    const next = String(value || "");
    setBranchId(next);
    if (next) localStorage.setItem("masa_sales_branch_id", next);
    else localStorage.removeItem("masa_sales_branch_id");
  };

  const value = useMemo(
    () => ({
      branches,
      branchId,
      branch: branches.find((b) => String(b.id) === String(branchId)) || null,
      loadingBranches,
      selectBranch,
    }),
    [branches, branchId, loadingBranches]
  );

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

export function useSalesContext() {
  const context = useContext(SalesContext);
  if (!context) throw new Error("useSalesContext must be used inside SalesProvider");
  return context;
}
