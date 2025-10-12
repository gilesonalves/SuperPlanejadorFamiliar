import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadLocal,
  saveLocal,
  subscribeLocal,
  type AppState,
  type BudgetItem,
} from "@/services/storage";

const monthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const readString = (
  record: Record<string, unknown>,
  keys: string[],
  fallback = "",
): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
};

const readNumber = (
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0,
): number => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
};

const normalizeBudgetItem = (item: Partial<BudgetItem>, index: number): BudgetItem => {
  const record = toRecord(item);
  const fallbackId = `b-${Date.now()}-${index}`;
  const id = readString(record, ["id"], fallbackId);
  const planned = readNumber(record, ["planned", "planejado"], 0);
  const actual = readNumber(record, ["actual", "realizado"], 0);
  const rawType = readString(record, ["type"]);
  const type: BudgetItem["type"] =
    rawType === "income" || rawType === "expense"
      ? rawType
      : planned >= 0
        ? "income"
        : "expense";
  const month = readString(record, ["month", "mes"], monthKey());
  const category = readString(record, ["category", "categoria"]);

  return {
    id,
    category,
    planned,
    actual,
    type,
    month,
  };
};

const normalizeState = (state: AppState): AppState => ({
  ...state,
  budget: Array.isArray(state.budget)
    ? state.budget.map((item, index) => normalizeBudgetItem(item, index))
    : [],
});

export function useBudget() {
  const [state, setState] = useState<AppState>(() => normalizeState(loadLocal()));
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

  const addRow = useCallback((item?: Partial<BudgetItem>) => {
    setState((prev) => {
      const row = normalizeBudgetItem(
        {
          id: `b-${Date.now()}`,
          category: item?.category ?? "",
          planned: item?.planned ?? 0,
          actual: item?.actual ?? 0,
          type: item?.type ?? "expense",
          month: item?.month ?? monthKey(),
        },
        prev.budget.length,
      );
      return {
        ...prev,
        budget: [...prev.budget, row],
      };
    });
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<BudgetItem>) => {
    setState((prev) => ({
      ...prev,
      budget: prev.budget.map((row, index) =>
        row.id === id ? normalizeBudgetItem({ ...row, ...patch }, index) : row,
      ),
    }));
  }, []);

  const removeRow = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      budget: prev.budget.filter((row) => row.id !== id),
    }));
  }, []);

  const totals = useMemo(() => {
    return state.budget.reduce(
      (acc, row) => {
        if (row.type === "income") {
          acc.incomePlanned += row.planned || 0;
          acc.incomeActual += row.actual || 0;
        } else {
          acc.expensePlanned += row.planned || 0;
          acc.expenseActual += row.actual || 0;
        }
        return acc;
      },
      {
        incomePlanned: 0,
        incomeActual: 0,
        expensePlanned: 0,
        expenseActual: 0,
      },
    );
  }, [state.budget]);

  const balancePlanned = useMemo(
    () => totals.incomePlanned - totals.expensePlanned,
    [totals.incomePlanned, totals.expensePlanned],
  );

  const balanceActual = useMemo(
    () => totals.incomeActual - totals.expenseActual,
    [totals.incomeActual, totals.expenseActual],
  );

  return {
    state,
    addRow,
    updateRow,
    removeRow,
    totals,
    balancePlanned,
    balanceActual,
  };
}

export type UseBudgetResult = ReturnType<typeof useBudget>;
