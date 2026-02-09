import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBudgetFamiliar, type PerfilOrcamento } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { formatCurrency, isSameMonthYear } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  year: number;
  perfil: PerfilOrcamento;
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function SummaryYear({ year, perfil }: Props) {
  const { receitas, despesasFixas, despesasVariaveis } = useBudgetFamiliar();

  const { meses, totalReceitas, totalDespesas, saldoAno, maxValor } = useMemo(() => {
    const meses = monthLabels.map((label, monthIndex) => {
      const receitasMes = receitas
        .filter((r) => r.perfil === perfil && isSameMonthYear(r.data, monthIndex, year))
        .reduce((sum, r) => sum + r.valor, 0);

      const despesasFixasMes = despesasFixas
        .filter((d) => d.perfil === perfil && isSameMonthYear(d.dataVencimento, monthIndex, year))
        .reduce((sum, d) => sum + (d.valorPago > 0 ? d.valorPago : d.valorPrevisto), 0);

      const despesasVariaveisMes = despesasVariaveis
        .filter((d) => d.perfil === perfil && isSameMonthYear(d.data, monthIndex, year))
        .reduce((sum, d) => sum + d.valor, 0);

      const despesasMes = despesasFixasMes + despesasVariaveisMes;
      const saldoMes = receitasMes - despesasMes;

      return {
        label,
        receitas: receitasMes,
        despesas: despesasMes,
        saldo: saldoMes,
      };
    });

    const totalReceitas = meses.reduce((sum, item) => sum + item.receitas, 0);
    const totalDespesas = meses.reduce((sum, item) => sum + item.despesas, 0);
    const saldoAno = totalReceitas - totalDespesas;
    const maxValor = Math.max(0, ...meses.map((item) => Math.max(item.receitas, item.despesas)));

    return { meses, totalReceitas, totalDespesas, saldoAno, maxValor };
  }, [receitas, despesasFixas, despesasVariaveis, year, perfil]);

  const hasData = maxValor > 0;
  const perfilLabel = perfil === "familiar" ? "Familiar" : "Somente meu";

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Visão anual · {perfilLabel}
          </p>
          <h2 className="text-lg font-semibold">{year}</h2>
        </div>
        <Badge variant="secondary" className="text-xs uppercase">
          {perfilLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Total de receitas</div>
            <div className="kpi-value text-success">{formatCurrency(totalReceitas)}</div>
          </CardContent>
        </Card>
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Total de despesas</div>
            <div className="kpi-value text-destructive">{formatCurrency(totalDespesas)}</div>
          </CardContent>
        </Card>
        <Card className="kpi-card">
          <CardContent className="p-4">
            <div className="kpi-label">Saldo do ano</div>
            <div className={`kpi-value ${saldoAno >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(saldoAno)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="financial-card p-0">
        <CardContent className="p-0">
          <div className="grid grid-cols-4 gap-2 border-b border-border/60 bg-muted/40 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Mês</span>
            <span className="text-right">Receitas</span>
            <span className="text-right">Despesas</span>
            <span className="text-right">Saldo</span>
          </div>
          <div className="max-h-64 overflow-y-auto text-xs sm:text-sm">
            {meses.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-4 gap-2 border-b border-border/40 px-4 py-2 last:border-b-0"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="text-right">{formatCurrency(row.receitas)}</span>
                <span className="text-right text-destructive">{formatCurrency(row.despesas)}</span>
                <span className={`text-right ${row.saldo >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(row.saldo)}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 border-t border-border/60 bg-muted/30 px-4 py-2 text-xs font-semibold">
            <span className="text-muted-foreground">Total {year}</span>
            <span className="text-right">{formatCurrency(totalReceitas)}</span>
            <span className="text-right text-destructive">{formatCurrency(totalDespesas)}</span>
            <span className={`text-right ${saldoAno >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(saldoAno)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="financial-card p-0">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Receitas x despesas por mês
              </p>
              <p className="text-[11px] text-muted-foreground">
                Comparação mensal do perfil selecionado.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span>Despesas</span>
              </div>
            </div>
          </div>

          {!hasData ? (
            <div className="rounded-xl bg-muted/40 px-3 py-6 text-center text-xs text-muted-foreground sm:text-sm">
              Adicione receitas e despesas ao longo do ano para ver o gráfico mensal.
            </div>
          ) : (
            <div className="flex items-end gap-3 overflow-x-auto pb-1 pt-2">
              {meses.map((row) => {
                const receitaPerc = maxValor ? (row.receitas / maxValor) * 100 : 0;
                const despesaPerc = maxValor ? (row.despesas / maxValor) * 100 : 0;
                const receitaAltura = row.receitas > 0 ? Math.max(receitaPerc, 12) : 0;
                const despesaAltura = row.despesas > 0 ? Math.max(despesaPerc, 12) : 0;

                return (
                  <div key={row.label} className="flex flex-col items-center gap-1 text-[10px]">
                    <div className="flex h-32 w-8 items-end justify-center gap-[2px] rounded-full bg-muted/60 px-[3px] pb-1 pt-1 sm:h-36 sm:w-9">
                      <div
                        className="w-[6px] rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)] transition-all"
                        style={{ height: receitaAltura ? `${receitaAltura}%` : "0%" }}
                      />
                      <div
                        className="w-[6px] rounded-full bg-cyan-500/90 shadow-[0_0_10px_rgba(34,211,238,0.45)] transition-all"
                        style={{ height: despesaAltura ? `${despesaAltura}%` : "0%" }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{row.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
