import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DespesaFixa } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { formatCurrency, formatDate } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  data: DespesaFixa[];
  onEdit: (item: DespesaFixa) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

export function DespesasFixasTable({ data, onEdit, onDelete, disabled }: Props) {
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const isDisabled = Boolean(disabled);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase();
    return data.filter(
      (item) =>
        item.conta.toLowerCase().includes(term) ||
        item.categoria.toLowerCase().includes(term),
    );
  }, [data, filter]);

  return (
    <Card className="financial-card p-0">
      <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Despesas fixas do período</p>
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por conta ou categoria"
          className="w-full max-w-sm sm:w-64"
        />
      </div>

      <div className="block px-4 pb-4 pt-2 md:hidden">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma despesa fixa cadastrada.
          </p>
        ) : null}

        <div className="space-y-3">
          {filtered.map((item) => {
            const diferenca = item.valorPrevisto - (item.valorPago || 0);
            const diferencaClass =
              diferenca > 0 ? "text-warning" : diferenca < 0 ? "text-success" : "text-foreground";
            const isOpen = openId === item.id;

            return (
              <div key={item.id} className="rounded-lg border border-border/60 bg-muted/20">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-muted-foreground">{formatDate(item.dataVencimento)}</span>
                    <span className="text-sm font-medium">{item.conta}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.categoria || "Sem categoria"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Previsto</span>
                    <span className="text-sm font-semibold">{formatCurrency(item.valorPrevisto)}</span>
                    <span className="text-xs text-success">
                      {isOpen ? "Ocultar ▲" : "Detalhes ▼"}
                    </span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-border/60 px-3 pb-3 pt-2">
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <span className="block text-[11px] text-muted-foreground">Pago</span>
                        <span>{formatCurrency(item.valorPago || 0)}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-muted-foreground">Diferença</span>
                        <span className={`font-semibold ${diferencaClass}`}>
                          {formatCurrency(diferenca)}
                        </span>
                      </div>
                    </div>

                    {item.recorrente ? (
                      <p className="mt-1 text-[11px] font-medium text-success">
                        Recorrente todo mês
                      </p>
                    ) : null}

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                        disabled={isDisabled}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        disabled={isDisabled}
                        className="text-destructive hover:text-destructive"
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="mt-3 w-full min-w-[720px] table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2 font-semibold">Vencimento</th>
              <th className="px-4 py-2 font-semibold">Conta</th>
              <th className="px-4 py-2 font-semibold">Categoria</th>
              <th className="px-4 py-2 font-semibold">Previsto</th>
              <th className="px-4 py-2 font-semibold">Pago</th>
              <th className="px-4 py-2 font-semibold">Diferença</th>
              <th className="px-4 py-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                  Nenhuma despesa fixa cadastrada.
                </td>
              </tr>
            ) : null}
            {filtered.map((item) => {
              const diferenca = item.valorPrevisto - (item.valorPago || 0);
              const diferencaClass =
                diferenca > 0 ? "text-warning" : diferenca < 0 ? "text-success" : "text-foreground";
              return (
                <tr key={item.id} className="border-t border-border/60">
                  <td className="px-4 py-2">{formatDate(item.dataVencimento)}</td>
                  <td className="px-4 py-2">{item.conta}</td>
                  <td className="px-4 py-2">{item.categoria}</td>
                  <td className="px-4 py-2">{formatCurrency(item.valorPrevisto)}</td>
                  <td className="px-4 py-2">{formatCurrency(item.valorPago || 0)}</td>
                  <td className={`px-4 py-2 font-semibold ${diferencaClass}`}>
                    {formatCurrency(diferenca)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                        disabled={isDisabled}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        disabled={isDisabled}
                        className="text-destructive hover:text-destructive"
                      >
                        Excluir
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
