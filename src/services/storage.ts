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
