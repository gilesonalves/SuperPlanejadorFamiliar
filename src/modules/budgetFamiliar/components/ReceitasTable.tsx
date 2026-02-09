import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Receita } from "@/modules/budgetFamiliar/hooks/useBudgetFamiliar";
import { formatCurrency, formatDate } from "@/modules/budgetFamiliar/utils/format";

type Props = {
  data: Receita[];
  onEdit: (item: Receita) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
};

export function ReceitasTable({ data, onEdit, onDelete, disabled }: Props) {
  const [filter, setFilter] = useState("");
  const isDisabled = Boolean(disabled);

  const filtered = useMemo(() => {
    const term = filter.toLowerCase();
    return data.filter(
      (item) =>
        item.fonte.toLowerCase().includes(term) ||
        item.tipo.toLowerCase().includes(term),
    );
  }, [data, filter]);

  return (
    <Card className="financial-card p-0">
      <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Receitas do período</p>
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por fonte ou tipo"
          className="w-full max-w-xs sm:w-56"
        />
      </div>

      <div className="block px-4 pb-4 pt-2 md:hidden">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado.
          </p>
        ) : null}

        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{formatDate(item.data)}</span>
                <span className="text-sm font-semibold text-success">
                  {formatCurrency(item.valor)}
                </span>
              </div>
              <p className="mt-1 text-sm font-medium">{item.fonte}</p>
              <p className="text-xs text-muted-foreground">{item.tipo}</p>

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
          ))}
        </div>
      </div>

      <div className="hidden w-full overflow-x-auto md:block">
        <table className="mt-3 w-full min-w-[640px] table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-muted/40 text-left text-muted-foreground">
              <th className="px-4 py-2 font-semibold">Data</th>
              <th className="px-4 py-2 font-semibold">Fonte</th>
              <th className="px-4 py-2 font-semibold">Tipo</th>
              <th className="px-4 py-2 font-semibold">Valor</th>
              <th className="px-4 py-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            ) : null}
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-border/60">
                <td className="px-4 py-2">{formatDate(item.data)}</td>
                <td className="px-4 py-2">{item.fonte}</td>
                <td className="px-4 py-2">{item.tipo}</td>
                <td className="px-4 py-2">{formatCurrency(item.valor)}</td>
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
