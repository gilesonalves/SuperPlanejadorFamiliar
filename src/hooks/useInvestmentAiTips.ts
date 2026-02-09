import { useCallback, useMemo, useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  requestInvestmentTips,
  type InvestmentAiInput,
  type InvestmentAiPortfolioItem,
} from "@/services/groq";

type PortfolioSummary = {
  items: InvestmentAiPortfolioItem[];
  totalValue: number;
  allocationPct: InvestmentAiInput["allocationPct"];
  riskProfile: InvestmentAiInput["riskProfile"];
  goal: InvestmentAiInput["goal"];
  baseCurrency: InvestmentAiInput["baseCurrency"];
  sectorSummary: InvestmentAiInput["sectorSummary"];
};

const buildSummary = (
  items: InvestmentAiPortfolioItem[],
  preferences: Pick<PortfolioSummary, "riskProfile" | "goal" | "baseCurrency">,
  sectorSummary: InvestmentAiInput["sectorSummary"],
): PortfolioSummary => {
  const totals = items.reduce(
    (acc, item) => {
      acc.total += item.totalValue;
      if (item.assetClass === "FII") acc.fii += item.totalValue;
      if (item.assetClass === "ACAO") acc.acao += item.totalValue;
      if (item.assetClass === "CRYPTO") acc.crypto += item.totalValue;
      return acc;
    },
    { total: 0, fii: 0, acao: 0, crypto: 0 },
  );

  const pct = totals.total > 0
    ? {
        fii: (totals.fii / totals.total) * 100,
        acao: (totals.acao / totals.total) * 100,
        crypto: (totals.crypto / totals.total) * 100,
      }
    : { fii: 0, acao: 0, crypto: 0 };

  return {
    items,
    totalValue: totals.total,
    allocationPct: pct,
    riskProfile: preferences.riskProfile,
    goal: preferences.goal,
    baseCurrency: preferences.baseCurrency,
    sectorSummary,
  };
};

export function useInvestmentAiTips() {
  const { state } = usePortfolio();
  const portfolioItems = useMemo<InvestmentAiPortfolioItem[]>(
    () =>
      state.portfolio.map((item) => ({
        symbol: item.symbol,
        name: item.name || undefined,
        sector: item.sector || undefined,
        assetClass: item.assetClass,
        qty: item.qty,
        price: item.price,
        totalValue: item.qty * (item.price ?? 0),
      })),
    [state.portfolio],
  );

  const sectorSummary = useMemo(() => {
    const map = new Map<string, number>();
    portfolioItems.forEach((item) => {
      const key = (item.sector || "-").trim() || "-";
      map.set(key, (map.get(key) || 0) + item.totalValue);
    });
    const total = Array.from(map.values()).reduce((acc, value) => acc + value, 0);
    return Array.from(map.entries())
      .map(([sector, value]) => ({
        sector,
        pct: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 6);
  }, [portfolioItems]);

  const summary = useMemo(
    () =>
      buildSummary(portfolioItems, {
        riskProfile: state.settings.riskProfile,
        goal: state.settings.goal,
        baseCurrency: state.settings.baseCurrency,
      }, sectorSummary),
    [
      portfolioItems,
      sectorSummary,
      state.settings.baseCurrency,
      state.settings.goal,
      state.settings.riskProfile,
    ],
  );
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [error, setError] = useState("");

  const requestTips = useCallback(
    async (availableAmount: number) => {
      if (loading) return;
      setLoading(true);
      setError("");

      try {
        const payload: InvestmentAiInput = {
          items: summary.items,
          totalValue: summary.totalValue,
          allocationPct: summary.allocationPct,
          availableAmount,
          riskProfile: summary.riskProfile,
          goal: summary.goal,
          baseCurrency: summary.baseCurrency,
          sectorSummary: summary.sectorSummary,
        };
        const result = await requestInvestmentTips(payload);
        setAdvice(result);
      } catch (err) {
        console.error("AI tips failed", err);
        setAdvice("");
        const message = err instanceof Error ? err.message : "";
        if (
          message === "IA não configurada no ambiente." ||
          message === "Falha ao conectar com a IA" ||
          message === "Serviço temporariamente indisponível"
        ) {
          setError(message);
        } else {
          setError("Falha ao conectar com a IA");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, summary],
  );

  return {
    advice,
    error,
    loading,
    requestTips,
    hasPortfolio: summary.items.length > 0,
  };
}
