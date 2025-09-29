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

const normalizeBudgetItem = (item: BudgetItem, index: number): BudgetItem => {
  const fallbackId = `b-${Date.now()}-${index}`;
  const id = typeof item.id === "string" && item.id.length ? item.id : fallbackId;
  const planned = Number((item as any).planned ?? (item as any).planejado ?? 0) || 0;
  const actual = Number((item as any).actual ?? (item as any).realizado ?? 0) || 0;
  const rawType = (item as any).type;
  const type = rawType === "income" || rawType === "expense" ? rawType : planned >= 0 ? "income" : "expense";
  const month = (item as any).month ?? (item as any).mes ?? monthKey();

  return {
    id,
    category: (item as any).category ?? (item as any).categoria ?? "",
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
        } as BudgetItem,
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
