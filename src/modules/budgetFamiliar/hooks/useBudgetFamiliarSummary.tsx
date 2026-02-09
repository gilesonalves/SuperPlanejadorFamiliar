import { useEffect, useMemo, useState } from "react";
import {
  loadBudgetFamiliarState,
  subscribeBudgetFamiliar,
  type BudgetFamiliarState,
  type PerfilOrcamento,
} from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { isSameMonthYear } from "@/modules/budgetFamiliar/utils/format";

type SummaryParams = {
  month?: number;
  year?: number;
  profile?: PerfilOrcamento;
};

const getCurrentMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
};

const calculateSummary = (
  state: BudgetFamiliarState,
  month: number,
  year: number,
  profile: PerfilOrcamento,
) => {
  const incomeTotal = state.receitas
    .filter((r) => r.perfil === profile && isSameMonthYear(r.data, month, year))
    .reduce((sum, r) => sum + r.valor, 0);

  const fixedTotal = state.despesasFixas
    .filter((d) => d.perfil === profile && isSameMonthYear(d.dataVencimento, month, year))
    .reduce((sum, d) => sum + (d.valorPago > 0 ? d.valorPago : d.valorPrevisto), 0);

  const variableTotal = state.despesasVariaveis
    .filter((d) => d.perfil === profile && isSameMonthYear(d.data, month, year))
    .reduce((sum, d) => sum + d.valor, 0);

  const expenseTotal = fixedTotal + variableTotal;
  const balanceTotal = incomeTotal - expenseTotal;

  return { incomeTotal, expenseTotal, balanceTotal };
};

export function useBudgetFamiliarSummary(params: SummaryParams = {}) {
  const { month: fallbackMonth, year: fallbackYear } = getCurrentMonthYear();
  const month = params.month ?? fallbackMonth;
  const year = params.year ?? fallbackYear;
  const profile = params.profile ?? "familiar";

  const [state, setState] = useState<BudgetFamiliarState>(() => loadBudgetFamiliarState());

  useEffect(() => {
    return subscribeBudgetFamiliar(() => setState(loadBudgetFamiliarState()));
  }, []);

  return useMemo(
    () => ({
      month,
      year,
      profile,
      ...calculateSummary(state, month, year, profile),
    }),
    [state, month, year, profile],
  );
}
