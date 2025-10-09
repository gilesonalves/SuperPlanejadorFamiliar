// ===== Tipos base =====
export type AssetClass = "FII" | "ACAO" | "CRYPTO";

export type PortfolioItem = {
  id: string;
  symbol: string;           // ticker (ex.: MXRF11 / PETR4 / BTC)
  name: string;
  sector: string;
  qty: number;
  price: number;
  monthlyYield?: number;    // % ao mês (opcional)
  assetClass: AssetClass;
};

export type Targets = { fii: number; acao: number; crypto: number };

export type Settings = {
  contributionBudget: number;
  targetAllocation: Targets;        // agora inclui crypto
  brapiToken?: string;
};

export type AppState = {
  portfolio: unknown[];       // normalizado no hook
  budget: number;             // << FALTAVA
  settings: Settings;
}

// ===== Estado/Helpers =====
export const defaultState: AppState = {
  portfolio: [],
  budget: 0,                                  // << AQUI
  settings: {
    contributionBudget: 0,
    targetAllocation: { fii: 70, acao: 30, crypto: 0 }, // << crypto aqui
    brapiToken: "",
  },
};

// opcional: clone “seguro”
export function cloneDefaultState(): AppState {
  return JSON.parse(JSON.stringify(defaultState)) as AppState;
}



// ===== Persistência local =====
const LS_KEY = "superplanejador_state_v1";

export function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return cloneDefaultState();
    const parsed = JSON.parse(raw);
    // fallback simples (não deixa quebrar se faltar algo)
    return {
      portfolio: Array.isArray(parsed?.portfolio) ? parsed.portfolio : [],
      budget: Array.isArray(parsed?.budget) ? parsed.budget : [],
      settings: {
        ...defaultState.settings,
        ...(parsed?.settings ?? {}),
      },
    };
  } catch {
    return cloneDefaultState();
  }
}

export function saveLocal(state: AppState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("saveLocal failed", e);
  }
}

// assinatura de mudanças externas (import/export)
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeLocal(cb: Listener): () => void {
  listeners.add(cb);
  const onStorage = (ev: StorageEvent) => {
    if (ev.key === LS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

// helper para notificar (se você chamar saveLocal fora do hook)
export function notifyLocalChange() {
  for (const cb of listeners) cb();
}


// === Wallet history (time series do valor total) ===
export type HistoryPoint = { date: string; total: number };

const HISTORY_KEY = "walletHistory_v1";
export function loadHistory(): HistoryPoint[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr.filter(p => p && typeof p.total === "number" && typeof p.date === "string");
    return [];
  } catch { return []; }
}
export function saveHistory(points: HistoryPoint[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(points)); } catch { /* empty */ }
}
export function upsertTodayHistory(total: number) {
  const today = new Date(); today.setHours(0,0,0,0);
  const key = today.toISOString().slice(0,10);
  const hist = loadHistory();
  const i = hist.findIndex(p => p.date === key);
  if (i >= 0) hist[i] = { date: key, total };
  else hist.push({ date: key, total });
  saveHistory(hist);
}

// === Cache diario de cotacoes ===
type QuoteCacheEntry = { symbol: string; date: string; payload: unknown };
const QUOTE_CACHE_KEY = "quoteCache_v1";
function loadQuoteCache(): QuoteCacheEntry[] {
  try { const j = localStorage.getItem(QUOTE_CACHE_KEY); return j ? JSON.parse(j) : []; }
  catch { return []; }
}
function saveQuoteCache(arr: QuoteCacheEntry[]) {
  try { localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(arr)); } catch { /* empty */ }
}
export function getCachedDailyQuote(symbol: string): unknown | null {
  const dateKey = new Date().toISOString().slice(0,10);
  const cache = loadQuoteCache();
  const hit = cache.find(e => e.symbol === symbol && e.date === dateKey);
  return hit ? hit.payload : null;
}
export function setCachedDailyQuote(symbol: string, payload: unknown) {
  const dateKey = new Date().toISOString().slice(0,10);
  const cache = loadQuoteCache();
  const idx = cache.findIndex(e => e.symbol === symbol && e.date === dateKey);
  if (idx >= 0) cache[idx] = { symbol, date: dateKey, payload };
  else cache.push({ symbol, date: dateKey, payload });
  // Limpeza simples: mantem so 400 itens
  if (cache.length > 400) cache.splice(0, cache.length - 400);
  saveQuoteCache(cache);
}

