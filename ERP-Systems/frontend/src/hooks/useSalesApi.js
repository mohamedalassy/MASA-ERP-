
import { useCallback, useEffect, useState } from "react";
import { salesApi, unwrap, withBranch } from "../lib/salesApi";
import { useSalesContext } from "../context/SalesContext";

export function useSalesApi(path, options = {}) {
  const { branchId } = useSalesContext();
  const { branchAware = true, auto = true } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(auto);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const target = branchAware ? withBranch(path, branchId) : path;
      const payload = await salesApi.get(target);
      const value = unwrap(payload);
      setData(value);
      return value;
    } catch (err) {
      setError(err?.message || "تعذر تحميل البيانات.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path, branchId, branchAware]);

  useEffect(() => {
    if (!auto) return;
    refresh().catch(() => {});
  }, [refresh, auto]);

  return { data, setData, loading, error, refresh };
}
