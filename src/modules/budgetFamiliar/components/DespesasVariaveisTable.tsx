import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DespesaVariavel } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { formatCurrency, formatDate } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  data: DespesaVariavel[];
  onEdit: (item: DespesaVariavel) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

export function DespesasVariaveisTable({ data, onEdit, onDelete, disabled }: Props) {
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const isDisabled = Boolean(disabled);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase();
    return data.filter(
      (item) =>
        item.categoria.toLowerCase().includes(term) ||
        item.descricao.toLowerCase().includes(term) ||
        item.formaPagamento.toLowerCase().includes(term),
    );
  }, [data, filter]);

  return (
    <Card className="financial-card p-0">
      <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Despesas variáveis</p>
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por categoria, descrição ou forma"
          className="w-full max-w-sm sm:w-72"
        />
      </div>

      <div className="block px-4 pb-4 pt-2 md:hidden">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhuma despesa variável encontrada.
          </p>
        ) : null}

        <div className="space-y-3">
          {filtered.map((item) => {
            const isOpen = openId === item.id;
            const isEssencial = item.essencial;
            const borderClass = isEssencial ? "border-emerald-500/50" : "border-amber-500/40";

            return (
              <div key={item.id} className={`rounded-lg border ${borderClass} bg-muted/20`}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                    <span className="text-sm font-medium">{item.categoria}</span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {item.descricao}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground">Valor</span>
                    <span className="text-sm font-semibold">{formatCurrency(item.valor)}</span>
                    <Badge
                      variant="secondary"
                      className={`mt-1 ${isEssencial ? "text-emerald-300" : "text-amber-300"}`}
                    >
                      {isEssencial ? "Essencial" : "Não essencial"}
                    </Badge>
                    <span className="mt-1 text-xs text-success">
                      {isOpen ? "Ocultar ▲" : "Detalhes ▼"}
                    </span>
                  </div>
                </button>

                {isOpen ? (
                  <div className="border-t border-border/60 px-3 pb-3 pt-2 text-xs text-muted-foreground">
                    <div className="space-y-2">
                      <div>
                        <span className="block text-[11px] text-muted-foreground">Descrição</span>
                        <span>{item.descricao}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-muted-foreground">
                          Forma de pagamento
                        </span>
                        <span>{item.formaPagamento}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
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
        <table className="mt-3 w-full min-w-[760px] table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2 font-semibold">Data</th>
              <th className="px-4 py-2 font-semibold">Categoria</th>
              <th className="px-4 py-2 font-semibold">Descrição</th>
              <th className="px-4 py-2 font-semibold">Forma</th>
              <th className="px-4 py-2 font-semibold">Valor</th>
              <th className="px-4 py-2 font-semibold">Essencial?</th>
              <th className="px-4 py-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-muted-foreground">
                  Nenhuma despesa variável encontrada.
                </td>
              </tr>
            ) : null}
            {filtered.map((item) => (
              <tr
                key={item.id}
                className={`border-t border-border/60 ${
                  item.essencial ? "" : "bg-warning/10"
                }`}
              >
                <td className="px-4 py-2">{formatDate(item.data)}</td>
                <td className="px-4 py-2">{item.categoria}</td>
                <td className="px-4 py-2">{item.descricao}</td>
                <td className="px-4 py-2">{item.formaPagamento}</td>
                <td className="px-4 py-2">{formatCurrency(item.valor)}</td>
                <td className="px-4 py-2">{item.essencial ? "Sim" : "Não (não essencial)"}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(item)} disabled={isDisabled}>
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
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
