import { collection, db, doc, getDoc, setDoc } from "@/services/firebase";

const envBrapiToken = (() => {
  try {
    const raw = import.meta.env?.VITE_BRAPI_TOKEN;
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim();
    }
  } catch (error) {
    console.warn("BRAPI token env lookup failed", error);
  }
  return undefined;
})();

export type PortfolioItem = {
  id: string;
  symbol: string;
  name?: string;
  qty: number;
  price?: number;
  sector?: string;
  assetClass?: "FII" | "ACAO";
  monthlyYield?: number;
};

export type BudgetItem = {
  id: string;
  category: string;
  planned: number;
  actual: number;
  type: "income" | "expense";
  month: string;
};

export type AppStateSettings = {
  brapiToken?: string;
  targetAllocation?: {
    fii: number;
    acao: number;
  };
  contributionBudget?: number;
};

export type AppState = {
  portfolio: PortfolioItem[];
  budget: BudgetItem[];
  settings: AppStateSettings;
};

const KEY = "sp_state_v1";
const STATE_EVENT = "sp_state_update";
const defaultState: AppState = {
  portfolio: [],
  budget: [],
  settings: {
    targetAllocation: { fii: 70, acao: 30 },
    contributionBudget: 0,
    brapiToken: envBrapiToken,
  },
};

function baseSettings(): AppStateSettings {
  const allocation = defaultState.settings.targetAllocation ?? { fii: 70, acao: 30 };
  return {
    brapiToken: defaultState.settings.brapiToken,
    contributionBudget: defaultState.settings.contributionBudget ?? 0,
    targetAllocation: { ...allocation },
  };
}

function cloneDefaultState(): AppState {
  return {
    portfolio: [],
    budget: [],
    settings: baseSettings(),
  };
}

export function loadLocal(): AppState {
  if (typeof window === "undefined") return cloneDefaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return cloneDefaultState();
    const parsed = JSON.parse(raw);
    return {
      portfolio: Array.isArray(parsed?.portfolio) ? parsed.portfolio : [],
      budget: Array.isArray(parsed?.budget) ? parsed.budget : [],
      settings: {
        ...baseSettings(),
        ...(typeof parsed?.settings === "object" && parsed?.settings ? parsed.settings : {}),
      },
    };
  } catch (error) {
    console.error("Erro ao carregar estado local", error);
    return cloneDefaultState();
  }
}

export function saveLocal(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(STATE_EVENT));
}

export function subscribeLocal(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(STATE_EVENT, listener);
  return () => window.removeEventListener(STATE_EVENT, listener);
}

export async function loadCloud(userId: string): Promise<AppState | null> {
  const snapshot = await getDoc(doc(collection(db(), "sp_users"), userId));
  return snapshot.exists() ? (snapshot.data() as AppState) : null;
}

export async function saveCloud(userId: string, state: AppState) {
  await setDoc(doc(collection(db(), "sp_users"), userId), state, { merge: true });
}

export { STATE_EVENT, defaultState, cloneDefaultState };