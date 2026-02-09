import { useMemo } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";

export function useWalletSummary() {
  const { state, total } = usePortfolio();

  const monthlyYield = useMemo(
    () =>
      state.portfolio.reduce((sum, item) => {
        const value = (item.qty || 0) * (item.price || 0);
        const yieldValue = value * ((item.monthlyYield ?? 0) / 100);
        return sum + yieldValue;
      }, 0),
    [state.portfolio],
  );

  return {
    totalValue: total,
    monthlyYield,
  };
}
