import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadLocal,
  saveLocal,
  subscribeLocal,
  upsertTodayHistory,
  getCachedDailyQuote,
  setCachedDailyQuote,
  type AppState as StoreAppState,
  type PortfolioGoal,
  type RiskProfile,
} from "@/services/storage";
import { fetchQuoteSingle, fetchQuotesBatch, fetchQuotesSequential } from "@/services/brapi";

export type AssetClass = "FII" | "ACAO" | "CRYPTO";

export type PortfolioItem = {
  id: string;
  symbol: string; // ex: MXRF11 / PETR4 / BTC
  name: string;
  sector: string;
  qty: number;
  price: number;
  monthlyYield?: number;
  assetClass: AssetClass;
};

export type Targets = { fii: number; acao: number; crypto: number };

// Estado usado **dentro** do hook com portfolio tipado
type AppState = Omit<StoreAppState, "portfolio"> & { portfolio: PortfolioItem[] };

type Quote = {
  symbol: string;
  regularMarketPrice?: number;
  longName?: string;
  shortName?: string;
  sector?: string;
};

type PortfolioItemLike = Partial<PortfolioItem> & {
  symbol?: string; // alias antigos
  ticker?: string;
  setor?: string;
  preco?: number;
  quantity?: number;
  classe?: string;
  class?: string;
};

type SettingsLike = Partial<StoreAppState["settings"]>;

const toStringSafe = (v: unknown): string => (v ?? "").toString();
const toNumberSafe = (v: unknown): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};
const toAssetClass = (v: unknown): AssetClass => {
  return v === "FII" || v === "ACAO" || v === "CRYPTO" ? v : "FII";
};
const toRiskProfile = (v: unknown): RiskProfile => {
  if (v === "conservador" || v === "moderado" || v === "arrojado") return v;
  return "moderado";
};
const toGoal = (v: unknown): PortfolioGoal => {
  if (v === "crescimento" || v === "renda-passiva" || v === "preservacao") return v;
  return "crescimento";
};
const toBaseCurrency = (v: unknown): "BRL" => (v === "BRL" ? "BRL" : "BRL");
const clamp = (v: unknown, min = 0, max = 100): number => {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
};

function normalizePortfolioItem(item: PortfolioItemLike, index: number): PortfolioItem {
  const id =
    typeof item.id === "string" && item.id.length > 0 ? item.id : `p-${Date.now()}-${index}`;

  const symbol = toStringSafe(item.symbol ?? item.ticker).toUpperCase();
  const name = toStringSafe(item.name);
  const sector = toStringSafe(item.sector ?? item.setor);
  const qty = toNumberSafe(item.qty ?? item.quantity);
  const price = toNumberSafe(item.price ?? item.preco);
  const monthlyYield = toNumberSafe(item.monthlyYield);
  const assetClass = toAssetClass(item.assetClass ?? item.classe ?? item.class);

  return { id, symbol, name, sector, qty, price, monthlyYield, assetClass };
}

function normalizeSettings(settings: SettingsLike): AppState["settings"] {
  const rawTargets = settings?.targetAllocation ?? { fii: 70, acao: 30, crypto: 0 };

  return {
    contributionBudget: toNumberSafe(settings?.contributionBudget),
    targetAllocation: {
      fii: clamp(rawTargets.fii, 0, 100),
      acao: clamp(rawTargets.acao, 0, 100),
      crypto: clamp(rawTargets.crypto, 0, 100),
    },
    brapiToken: toStringSafe(settings?.brapiToken),
    riskProfile: toRiskProfile(settings?.riskProfile),
    goal: toGoal(settings?.goal),
    baseCurrency: toBaseCurrency(settings?.baseCurrency),
  };
}

function normalizeState(state: StoreAppState): AppState {
  const portfolio = Array.isArray(state.portfolio)
    ? state.portfolio.map((it, index) => normalizePortfolioItem(it as PortfolioItemLike, index))
    : [];

  return {
    ...state,
    portfolio,
    budget: Array.isArray(state.budget) ? state.budget : [],
    settings: normalizeSettings(state.settings),
  };
}

// ===== Hook principal =====
export function usePortfolio() {
  const [state, setState] = useState<AppState>(() => normalizeState(loadLocal()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipSaveRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeLocal(() => {
      skipSaveRef.current = true;
      setState(normalizeState(loadLocal()));
    });

    return unsubscribe;
  }, []);

  // persiste mudancas locais
  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    saveLocal(state);
  }, [state]);

  const addItem = useCallback((item: Omit<PortfolioItem, "id">) => {
    setState((prev) => {
      const normalized = normalizePortfolioItem(
        { ...item, id: `${item.symbol}-${Date.now()}` },
        prev.portfolio.length,
      );

      return {
        ...prev,
        portfolio: [...prev.portfolio, normalized],
      };
    });
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PortfolioItem>) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.map((it, index) =>
        it.id === id ? normalizePortfolioItem({ ...it, ...patch }, index) : it,
      ),
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      portfolio: prev.portfolio.filter((it) => it.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((settings: Partial<AppState["settings"]>) => {
    setState((prev) => ({
      ...prev,
      settings: normalizeSettings({ ...prev.settings, ...settings }),
    }));
  }, []);

  const refreshQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const latest = normalizeState(loadLocal());
      const tickers = Array.from(new Set(latest.portfolio.map((i) => i.symbol))).filter(Boolean);
      if (!tickers.length) return;

      const quotes: Quote[] = await fetchQuotesBatch(tickers, { countAction: true });
      const map = new Map<string, Quote>(quotes.map((q) => [q.symbol, q]));

      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio.map((it, index) => {
          const q = map.get(it.symbol);
          if (!q) return it;
          try {
            setCachedDailyQuote(it.symbol, q);
          } catch { /* empty */ }

          return normalizePortfolioItem(
            {
              ...it,
              price: q.regularMarketPrice ?? it.price,
              name: q.longName ?? q.shortName ?? it.name,
              sector: q.sector ?? it.sector,
            },
            index,
          );
        }),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar cotacoes");
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTicker = useCallback(
    async (symbol: string) => {
      if (!symbol) return;

      const cached = getCachedDailyQuote(symbol);
      if (cached) {
        setState((prev) => ({
          ...prev,
          portfolio: prev.portfolio.map((item, index) => {
            if (item.symbol !== symbol) return item;
            const q = cached as Quote;
            return normalizePortfolioItem(
              {
                ...item,
                price: q?.regularMarketPrice ?? item.price,
                name: q?.longName ?? q?.shortName ?? item.name,
                sector: q?.sector ?? item.sector,
              },
              index,
            );
          }),
        }));
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const q = await fetchQuoteSingle(symbol);
        try {
          if (q) setCachedDailyQuote(symbol, q);
        } catch { /* empty */ }

        setState((prev) => ({
          ...prev,
          portfolio: prev.portfolio.map((it, index) =>
            it.symbol === symbol
              ? normalizePortfolioItem(
                  {
                    ...it,
                    price: q?.regularMarketPrice ?? it.price,
                    name: q?.longName ?? q?.shortName ?? it.name,
                    sector: q?.sector ?? it.sector,
                  },
                  index,
                )
              : it,
          ),
        }));
      } catch (e: unknown) {
        setError(`Erro ao atualizar ${symbol}: ${e instanceof Error ? e.message : "desconhecido"}`);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refreshQuotesSequentialAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tickers = Array.from(new Set(state.portfolio.map((i) => i.symbol))).filter(Boolean);
      if (!tickers.length) return;

      const quotes: Quote[] = await fetchQuotesSequential(tickers, {
        delayMs: 350,
        maxRetries: 2,
        countAction: true,
      });
      const map = new Map(quotes.map((q: Quote) => [q.symbol, q]));

      setState((prev) => ({
        ...prev,
        portfolio: prev.portfolio.map((it, index) => {
          const q = map.get(it.symbol);
          if (!q) return it;
          try {
            setCachedDailyQuote(it.symbol, q);
          } catch { /* empty */ }
          return normalizePortfolioItem(
            {
              ...it,
              price: q?.regularMarketPrice ?? it.price,
              name: q?.longName ?? q?.shortName ?? it.name,
              sector: q?.sector ?? it.sector,
            },
            index,
          );
        }),
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar cotacoes (sequencial)");
    } finally {
      setLoading(false);
    }
  }, [state.portfolio]);

  const total = useMemo(
    () => state.portfolio.reduce((acc, it) => acc + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
    [state.portfolio],
  );

  useEffect(() => {
    try { upsertTodayHistory(total); } catch { /* empty */ }
  }, [total]);

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
