import { useEffect, useMemo, useState } from "react";
import {
  loadBudgetFamiliarState,
  subscribeBudgetFamiliar,
  type BudgetFamiliarState,
  type DespesaFixa,
  type PerfilOrcamento,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { toDate } from "@/modules/budgetFamiliar/utils/format";

type CashForecastResult = {
  projectedBalance30d: number;
  lowestBalance: number;
  riskLevel: "low" | "medium" | "high";
};

type CashEvent = {
  date: Date;
  amount: number;
};

const startOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const addDays = (value: Date, days: number) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate() + days);

const pickFixedAmount = (item: DespesaFixa) =>
  item.valorPago > 0 ? item.valorPago : item.valorPrevisto;

const moveDateToMonthYear = (base: Date, targetMonth: number, targetYear: number) => {
  const lastDayOfTarget = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(base.getDate(), lastDayOfTarget);
  return new Date(targetYear, targetMonth, clampedDay);
};

const listMonthsInRange = (start: Date, end: Date) => {
  const months: Array<{ month: number; year: number }> = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endCursor = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor.getTime() <= endCursor.getTime()) {
    months.push({ month: cursor.getMonth(), year: cursor.getFullYear() });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return months;
};

const buildFixedKey = (item: DespesaFixa, month: number, year: number) =>
  `${item.perfil}-${item.conta}-${item.categoria}-${year}-${month}`;

const sumByDate = (
  state: BudgetFamiliarState,
  profile: PerfilOrcamento,
  month: number,
  year: number,
  today: Date,
) => {
  const isOnOrBeforeToday = (value: Date) => value.getTime() <= today.getTime();

  const incomeTotal = state.receitas.reduce((sum, item) => {
    if (item.perfil !== profile) return sum;
    const date = toDate(item.data);
    if (!date) return sum;
    if (date.getMonth() === month && date.getFullYear() === year && isOnOrBeforeToday(date)) {
      return sum + item.valor;
    }
    return sum;
  }, 0);

  const fixedTotal = state.despesasFixas.reduce((sum, item) => {
    if (item.perfil !== profile) return sum;
    const date = toDate(item.dataVencimento);
    if (!date) return sum;
    if (date.getMonth() === month && date.getFullYear() === year && isOnOrBeforeToday(date)) {
      return sum + pickFixedAmount(item);
    }
    return sum;
  }, 0);

  const variableTotal = state.despesasVariaveis.reduce((sum, item) => {
    if (item.perfil !== profile) return sum;
    const date = toDate(item.data);
    if (!date) return sum;
    if (date.getMonth() === month && date.getFullYear() === year && isOnOrBeforeToday(date)) {
      return sum + item.valor;
    }
    return sum;
  }, 0);

  return { incomeTotal, expenseTotal: fixedTotal + variableTotal };
};

const sumMonthlyIncome = (
  state: BudgetFamiliarState,
  profile: PerfilOrcamento,
  month: number,
  year: number,
) =>
  state.receitas.reduce((sum, item) => {
    if (item.perfil !== profile) return sum;
    const date = toDate(item.data);
    if (!date) return sum;
    if (date.getMonth() === month && date.getFullYear() === year) {
      return sum + item.valor;
    }
    return sum;
  }, 0);

const calculateForecast = (
  state: BudgetFamiliarState,
  profile: PerfilOrcamento,
  today: Date,
  endDate: Date,
): CashForecastResult => {
  const month = today.getMonth();
  const year = today.getFullYear();
  const monthlyIncome = sumMonthlyIncome(state, profile, month, year);
  const { incomeTotal, expenseTotal } = sumByDate(state, profile, month, year, today);
  const startingBalance = incomeTotal - expenseTotal;

  const events: CashEvent[] = [];
  const fixedKeys = new Set<string>();

  const addEvent = (date: Date, amount: number) => {
    if (!Number.isFinite(amount) || amount === 0) return;
    events.push({ date: startOfDay(date), amount });
  };

  state.receitas.forEach((item) => {
    if (item.perfil !== profile) return;
    const date = toDate(item.data);
    if (!date) return;
    if (date.getTime() > today.getTime() && date.getTime() <= endDate.getTime()) {
      addEvent(date, item.valor);
    }
  });

  state.despesasVariaveis.forEach((item) => {
    if (item.perfil !== profile) return;
    const date = toDate(item.data);
    if (!date) return;
    if (date.getTime() > today.getTime() && date.getTime() <= endDate.getTime()) {
      addEvent(date, -item.valor);
    }
  });

  state.despesasFixas.forEach((item) => {
    if (item.perfil !== profile) return;
    const date = toDate(item.dataVencimento);
    if (!date) return;
    const key = buildFixedKey(item, date.getMonth(), date.getFullYear());
    fixedKeys.add(key);
    if (date.getTime() > today.getTime() && date.getTime() <= endDate.getTime()) {
      addEvent(date, -pickFixedAmount(item));
    }
  });

  // Add recurring fixed expenses for future months if they don't exist yet.
  const months = listMonthsInRange(today, endDate);
  state.despesasFixas.forEach((item) => {
    if (item.perfil !== profile || !item.recorrente) return;
    const baseDate = toDate(item.dataVencimento);
    if (!baseDate) return;
    const seriesStart = startOfDay(baseDate);

    months.forEach(({ month: targetMonth, year: targetYear }) => {
      const candidate = moveDateToMonthYear(baseDate, targetMonth, targetYear);
      if (candidate.getTime() <= today.getTime()) return;
      if (candidate.getTime() > endDate.getTime()) return;
      if (candidate.getTime() < seriesStart.getTime()) return;

      const key = buildFixedKey(item, targetMonth, targetYear);
      if (fixedKeys.has(key)) return;
      fixedKeys.add(key);
      addEvent(candidate, -pickFixedAmount(item));
    });
  });

  events.sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.amount - b.amount,
  );

  let balance = startingBalance;
  let lowestBalance = balance;

  events.forEach((event) => {
    balance += event.amount;
    if (balance < lowestBalance) lowestBalance = balance;
  });

  let riskLevel: CashForecastResult["riskLevel"] = "low";
  if (monthlyIncome > 0) {
    const threshold = monthlyIncome * -0.2;
    if (lowestBalance < threshold) riskLevel = "high";
    else if (lowestBalance < 0) riskLevel = "medium";
  } else if (lowestBalance < 0) {
    riskLevel = "high";
  }

  return {
    projectedBalance30d: balance,
    lowestBalance,
    riskLevel,
  };
};

export function useCashForecast(profile: PerfilOrcamento = "familiar") {
  const [state, setState] = useState<BudgetFamiliarState>(() => loadBudgetFamiliarState());

  useEffect(() => {
    return subscribeBudgetFamiliar(() => setState(loadBudgetFamiliarState()));
  }, []);

  return useMemo(() => {
    const today = startOfDay(new Date());
    const endDate = addDays(today, 30);
    return calculateForecast(state, profile, today, endDate);
  }, [state, profile]);
}
