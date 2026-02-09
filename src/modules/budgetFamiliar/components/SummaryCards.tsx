import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useBudgetFamiliar, type PerfilOrcamento } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { formatCurrency, isSameMonthYear } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  month: number;
  year: number;
  perfil: PerfilOrcamento;
};

export function SummaryCards({ month, year, perfil }: Props) {
  const { receitas, despesasFixas, despesasVariaveis } = useBudgetFamiliar();

  const totals = useMemo(() => {
    const receitasMes = receitas
      .filter((r) => r.perfil === perfil && isSameMonthYear(r.data, month, year))
      .reduce((sum, r) => sum + r.valor, 0);

    const despesasFixasMes = despesasFixas
      .filter((d) => d.perfil === perfil && isSameMonthYear(d.dataVencimento, month, year))
      .reduce((sum, d) => sum + (d.valorPago > 0 ? d.valorPago : d.valorPrevisto), 0);

    const despesasVariaveisMes = despesasVariaveis
      .filter((d) => d.perfil === perfil && isSameMonthYear(d.data, month, year))
      .reduce((sum, d) => sum + d.valor, 0);

    const saldo = receitasMes - (despesasFixasMes + despesasVariaveisMes);

    return {
      receitasMes,
      despesasFixasMes,
      despesasVariaveisMes,
      saldo,
    };
  }, [receitas, despesasFixas, despesasVariaveis, month, year, perfil]);

  const items = [
    { label: "Receitas", value: totals.receitasMes, className: "text-success" },
    { label: "Despesas fixas", value: totals.despesasFixasMes, className: "text-destructive" },
    { label: "Despesas variáveis", value: totals.despesasVariaveisMes, className: "text-destructive" },
    { label: "Saldo do mês", value: totals.saldo, className: "" },
  ];

  return (
    <div className="kpi-grid">
      {items.map((item) => (
        <Card key={item.label} className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">{item.label}</div>
            <div className={`kpi-value ${item.className}`}>{formatCurrency(item.value)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
