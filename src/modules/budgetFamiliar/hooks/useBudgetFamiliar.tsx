import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type PerfilOrcamento = "familiar" | "pessoal";

export type Receita = {
  id: string;
  data: string;
  fonte: string;
  tipo: "Fixa" | "Variável";
  valor: number;
  perfil: PerfilOrcamento;
};

export type DespesaFixa = {
  id: string;
  dataVencimento: string;
  conta: string;
  categoria: string;
  valorPrevisto: number;
  valorPago: number;
  recorrente: boolean;
  perfil: PerfilOrcamento;
};

export type DespesaVariavel = {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  formaPagamento: string;
  valor: number;
  essencial: boolean;
  perfil: PerfilOrcamento;
};

export type ReceitaInput = Omit<Receita, "id" | "perfil"> & { perfil?: PerfilOrcamento };
export type DespesaFixaInput = Omit<DespesaFixa, "id" | "perfil"> & { perfil?: PerfilOrcamento };
export type DespesaVariavelInput = Omit<DespesaVariavel, "id" | "perfil"> & { perfil?: PerfilOrcamento };

export type BudgetFamiliarState = {
  receitas: Receita[];
  despesasFixas: DespesaFixa[];
  despesasVariaveis: DespesaVariavel[];
};

type BudgetFamiliarContextValue = BudgetFamiliarState & {
  addReceita: (input: ReceitaInput) => void;
  updateReceita: (id: string, input: ReceitaInput) => void;
  deleteReceita: (id: string) => void;
  addDespesaFixa: (input: DespesaFixaInput) => void;
  updateDespesaFixa: (id: string, input: DespesaFixaInput) => void;
  deleteDespesaFixa: (id: string) => void;
  addDespesaVariavel: (input: DespesaVariavelInput) => void;
  updateDespesaVariavel: (id: string, input: DespesaVariavelInput) => void;
  deleteDespesaVariavel: (id: string) => void;
};

export const BUDGET_FAMILIAR_STORAGE_KEY = "superplanejador_budget_familiar_v1";

const emptyState: BudgetFamiliarState = {
  receitas: [],
  despesasFixas: [],
  despesasVariaveis: [],
};

const createId = () => `bf-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const readString = (record: Record<string, unknown>, key: string, fallback = "") => {
  const value = record[key];
  if (typeof value === "string") return value;
  return fallback;
};

const readNumber = (record: Record<string, unknown>, key: string, fallback = 0) => {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const readBoolean = (record: Record<string, unknown>, key: string, fallback = false) => {
  const value = record[key];
  if (typeof value === "boolean") return value;
  return fallback;
};

const asPerfil = (value: unknown): PerfilOrcamento => (value === "pessoal" ? "pessoal" : "familiar");
const ensurePerfil = (perfil?: PerfilOrcamento): PerfilOrcamento =>
  perfil === "pessoal" ? "pessoal" : "familiar";

const normalizeReceita = (item: Partial<Receita>, index: number): Receita => {
  const record = toRecord(item);
  const rawTipo = readString(record, "tipo", "Fixa");
  const tipo: Receita["tipo"] = rawTipo === "Variável" ? "Variável" : "Fixa";
  return {
    id: readString(record, "id", createId()),
    data: readString(record, "data"),
    fonte: readString(record, "fonte"),
    tipo,
    valor: readNumber(record, "valor"),
    perfil: asPerfil(record.perfil ?? item.perfil),
  };
};

const normalizeDespesaFixa = (item: Partial<DespesaFixa>, index: number): DespesaFixa => {
  const record = toRecord(item);
  return {
    id: readString(record, "id", createId()),
    dataVencimento: readString(record, "dataVencimento"),
    conta: readString(record, "conta"),
    categoria: readString(record, "categoria"),
    valorPrevisto: readNumber(record, "valorPrevisto"),
    valorPago: readNumber(record, "valorPago"),
    recorrente: readBoolean(record, "recorrente"),
    perfil: asPerfil(record.perfil ?? item.perfil),
  };
};

const normalizeDespesaVariavel = (
  item: Partial<DespesaVariavel>,
  index: number,
): DespesaVariavel => {
  const record = toRecord(item);
  return {
    id: readString(record, "id", createId()),
    data: readString(record, "data"),
    categoria: readString(record, "categoria"),
    descricao: readString(record, "descricao"),
    formaPagamento: readString(record, "formaPagamento"),
    valor: readNumber(record, "valor"),
    essencial: readBoolean(record, "essencial", true),
    perfil: asPerfil(record.perfil ?? item.perfil),
  };
};

const normalizeState = (state: BudgetFamiliarState): BudgetFamiliarState => ({
  receitas: Array.isArray(state.receitas)
    ? state.receitas.map((item, index) => normalizeReceita(item, index))
    : [],
  despesasFixas: Array.isArray(state.despesasFixas)
    ? state.despesasFixas.map((item, index) => normalizeDespesaFixa(item, index))
    : [],
  despesasVariaveis: Array.isArray(state.despesasVariaveis)
    ? state.despesasVariaveis.map((item, index) => normalizeDespesaVariavel(item, index))
    : [],
});

export const loadBudgetFamiliarState = (): BudgetFamiliarState => {
  try {
    const raw = localStorage.getItem(BUDGET_FAMILIAR_STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<BudgetFamiliarState>;
    return normalizeState({
      receitas: Array.isArray(parsed.receitas) ? parsed.receitas : [],
      despesasFixas: Array.isArray(parsed.despesasFixas) ? parsed.despesasFixas : [],
      despesasVariaveis: Array.isArray(parsed.despesasVariaveis) ? parsed.despesasVariaveis : [],
    });
  } catch {
    return emptyState;
  }
};

const saveLocal = (state: BudgetFamiliarState) => {
  try {
    localStorage.setItem(BUDGET_FAMILIAR_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("saveLocal budget familiar failed", error);
  }
};

type Listener = () => void;
const listeners = new Set<Listener>();

export const setBudgetFamiliarState = (state: BudgetFamiliarState) => {
  saveLocal(state);
  listeners.forEach((cb) => cb());
};

export const resetBudgetFamiliar = () => {
  setBudgetFamiliarState(emptyState);
};

export const subscribeBudgetFamiliar = (cb: Listener): (() => void) => {
  listeners.add(cb);
  const onStorage = (ev: StorageEvent) => {
    if (ev.key === BUDGET_FAMILIAR_STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
};

const BudgetFamiliarContext = createContext<BudgetFamiliarContextValue | undefined>(undefined);

export function BudgetFamiliarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetFamiliarState>(() => loadBudgetFamiliarState());
  const skipSaveRef = useRef(false);

  useEffect(() => {
    return subscribeBudgetFamiliar(() => {
      skipSaveRef.current = true;
      setState(loadBudgetFamiliarState());
    });
  }, []);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveLocal(state);
  }, [state]);

  const addReceita = useCallback((input: ReceitaInput) => {
    setState((prev) => ({
      ...prev,
      receitas: [
        ...prev.receitas,
        normalizeReceita(
          {
            id: createId(),
            ...input,
            perfil: ensurePerfil(input.perfil),
          },
          prev.receitas.length,
        ),
      ],
    }));
  }, []);

  const updateReceita = useCallback((id: string, input: ReceitaInput) => {
    setState((prev) => ({
      ...prev,
      receitas: prev.receitas.map((item, index) =>
        item.id === id
          ? normalizeReceita(
              { ...item, ...input, perfil: ensurePerfil(input.perfil ?? item.perfil) },
              index,
            )
          : item,
      ),
    }));
  }, []);

  const deleteReceita = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      receitas: prev.receitas.filter((item) => item.id !== id),
    }));
  }, []);

  const addDespesaFixa = useCallback((input: DespesaFixaInput) => {
    setState((prev) => ({
      ...prev,
      despesasFixas: [
        ...prev.despesasFixas,
        normalizeDespesaFixa(
          {
            id: createId(),
            ...input,
            perfil: ensurePerfil(input.perfil),
          },
          prev.despesasFixas.length,
        ),
      ],
    }));
  }, []);

  const updateDespesaFixa = useCallback((id: string, input: DespesaFixaInput) => {
    setState((prev) => ({
      ...prev,
      despesasFixas: prev.despesasFixas.map((item, index) =>
        item.id === id
          ? normalizeDespesaFixa(
              { ...item, ...input, perfil: ensurePerfil(input.perfil ?? item.perfil) },
              index,
            )
          : item,
      ),
    }));
  }, []);

  const deleteDespesaFixa = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      despesasFixas: prev.despesasFixas.filter((item) => item.id !== id),
    }));
  }, []);

  const addDespesaVariavel = useCallback((input: DespesaVariavelInput) => {
    setState((prev) => ({
      ...prev,
      despesasVariaveis: [
        ...prev.despesasVariaveis,
        normalizeDespesaVariavel(
          {
            id: createId(),
            ...input,
            perfil: ensurePerfil(input.perfil),
          },
          prev.despesasVariaveis.length,
        ),
      ],
    }));
  }, []);

  const updateDespesaVariavel = useCallback((id: string, input: DespesaVariavelInput) => {
    setState((prev) => ({
      ...prev,
      despesasVariaveis: prev.despesasVariaveis.map((item, index) =>
        item.id === id
          ? normalizeDespesaVariavel(
              { ...item, ...input, perfil: ensurePerfil(input.perfil ?? item.perfil) },
              index,
            )
          : item,
      ),
    }));
  }, []);

  const deleteDespesaVariavel = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      despesasVariaveis: prev.despesasVariaveis.filter((item) => item.id !== id),
    }));
  }, []);

  const value = useMemo<BudgetFamiliarContextValue>(
    () => ({
      ...state,
      addReceita,
      updateReceita,
      deleteReceita,
      addDespesaFixa,
      updateDespesaFixa,
      deleteDespesaFixa,
      addDespesaVariavel,
      updateDespesaVariavel,
      deleteDespesaVariavel,
    }),
    [
      state,
      addReceita,
      updateReceita,
      deleteReceita,
      addDespesaFixa,
      updateDespesaFixa,
      deleteDespesaFixa,
      addDespesaVariavel,
      updateDespesaVariavel,
      deleteDespesaVariavel,
    ],
  );

  return <BudgetFamiliarContext.Provider value={value}>{children}</BudgetFamiliarContext.Provider>;
}

export function useBudgetFamiliar() {
  const ctx = useContext(BudgetFamiliarContext);
  if (!ctx) {
    throw new Error("useBudgetFamiliar deve ser usado dentro de BudgetFamiliarProvider");
  }
  return ctx;
}
