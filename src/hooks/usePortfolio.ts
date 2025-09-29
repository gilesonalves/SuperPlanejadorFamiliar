import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchQuoteSingle, fetchQuotesBatch, fetchQuotesSequential } from "@/services/brapi";
import {
  loadLocal,
  saveLocal,
  subscribeLocal,
  type AppState,
  type PortfolioItem,
} from "@/services/storage";

const normalizePortfolioItem = (item: PortfolioItem, index: number): PortfolioItem => {
  const fallbackId = `p-${Date.now()}-${index}`;
  const id = typeof item.id === "string" && item.id.length > 0 ? item.id : fallbackId;
  const qty = Number((item as any).qty ?? (item as any).quantidade ?? 0) || 0;
  const price = Number((item as any).price ?? (item as any).preco ?? 0) || 0;
  const monthlyYield = Number((item as any).monthlyYield ?? (item as any).dyMensal ?? 0) || 0;
  const symbol = (item as any).symbol ?? (item as any).ticker ?? "";
  const assetClass = (item as any).assetClass ?? (item as any).classe;

  return {
    id,
    symbol,
    name: (item as any).name ?? (item as any).nome ?? "",
    sector: (item as any).sector ?? (item as any).setor ?? "",
    qty,
    price,
    monthlyYield,
    assetClass: assetClass === "FII" || assetClass === "ACAO" ? assetClass : undefined,
  };
};

const normalizeState = (state: AppState): AppState => ({
  ...state,
  portfolio: Array.isArray(state.portfolio)
    ? state.portfolio.map((item, index) => normalizePortfolioItem(item, index))
    : [],
});

export function usePortfolio() {
  const [state, setState] = useState<AppState>(() => normalizeState(loadLocal()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    return subscribeLocal(() => {
      skipSaveRef.current = true;
      setState(normalizeState(loadLocal()));
    });
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveLocal(state);
  }, [state]);

  const addItem = useCallback((item: Omit<PortfolioItem, "id">) => {
    const id = `${item.symbol}-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      portfolio: [...prev.portfolio, normalizePortfolioItem({ ...item, id } as PortfolioItem, prev.portfolio.length)],
    }));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PortfolioItem>) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.map((item, index) =>
        item.id === id
          ? normalizePortfolioItem({ ...item, ...patch }, index)
          : item,
      ),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((item) => item.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppState["settings"]>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...settings,
      },
    }));
  }, []);

  const refreshQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const latest = normalizeState(loadLocal());
      const tickers = Array.from(new Set(latest.portfolio.map((item) => item.symbol))).filter(Boolean);
      if (!tickers.length) {
        setLoading(false);
        return;
      }
      const quotes = await fetchQuotesBatch(tickers, latest.settings.brapiToken);
      const quoteMap = new Map(quotes.map((q: any) => [q.symbol, q]));
      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio.map((item, index) => {
          const quote = quoteMap.get(item.symbol);
          if (!quote) return item;
          return normalizePortfolioItem(
            {
              ...item,
              price: quote.regularMarketPrice ?? item.price,
              name: quote.longName ?? quote.shortName ?? item.name,
              sector: quote.sector ?? item.sector,
            } as PortfolioItem,
            index,
          );
        }),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar cotacoes";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTicker = useCallback(
    async (symbol: string) => {
      if (!symbol) return;
      const token = state.settings.brapiToken;
      try {
        setLoading(true);
        setError(null);
        const quote = await fetchQuoteSingle(symbol, token);
        setState((prev) => ({
          ...prev,
          portfolio: prev.portfolio.map((item, index) => {
            if (item.symbol !== symbol) return item;
            return normalizePortfolioItem(
              {
                ...item,
                price: quote?.regularMarketPrice ?? item.price,
                name: quote?.longName ?? quote?.shortName ?? item.name,
                sector: quote?.sector ?? item.sector,
              } as PortfolioItem,
              index,
            );
          }),
        }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "desconhecido";
        setError(`Erro ao atualizar ${symbol}: ${message}`);
      } finally {
        setLoading(false);
      }
    },
    [state.settings.brapiToken],
  );

  const refreshQuotesSequentialAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const latest = normalizeState(loadLocal());
      const tickers = Array.from(new Set(latest.portfolio.map((item) => item.symbol))).filter(Boolean);
      if (!tickers.length) {
        setLoading(false);
        return;
      }
      const quotes = await fetchQuotesSequential(tickers, {
        token: latest.settings.brapiToken,
        delayMs: 350,
        maxRetries: 2,
      });
      const quoteMap = new Map(quotes.map((q: any) => [q.symbol, q]));
      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio.map((item, index) => {
          const quote = quoteMap.get(item.symbol);
          if (!quote) return item;
          return normalizePortfolioItem(
            {
              ...item,
              price: quote?.regularMarketPrice ?? item.price,
              name: quote?.longName ?? quote?.shortName ?? item.name,
              sector: quote?.sector ?? item.sector,
            } as PortfolioItem,
            index,
          );
        }),
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao atualizar cotacoes (sequencial)";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const total = useMemo(
    () =>
      state.portfolio.reduce((acc, item) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        return acc + qty * price;
      }, 0),
    [state.portfolio],
  );

  return {
    state,
    setState,
    addItem,
    updateItem,
    removeItem,
    refreshQuotes,
    refreshTicker,
    refreshQuotesSequentialAll,
    updateSettings,
    total,
    loading,
    error,
  };
}

export type UsePortfolioResult = ReturnType<typeof usePortfolio>;