
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { ShoppingCategory } from "@/services/shopping/types";
import { getIcon } from "./icons";

type Props = {
  categories: ShoppingCategory[];
  getTotalByCategory: (id: string) => number;
  totalGeral: number;
  stats: { total: number };
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const TotalsBar = ({
  categories,
  getTotalByCategory,
  totalGeral,
  stats,
}: Props) => {
  const totalTone = totalGeral > 0
    ? "bg-primary/10 text-primary"
    : "bg-amber-100 text-amber-800";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {categories
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((category) => {
            const total = getTotalByCategory(category.id);
            if (total <= 0) {
              return null;
            }
            return (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{getIcon(category.icon)}</span>
                  <span className="text-sm font-medium">{category.nome}</span>
                </div>
                <span className="text-sm font-semibold">{currencyFormatter.format(total)}</span>
              </div>
            );
          })}
      </div>

      <Separator />

      <div className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:grid-cols-[auto,1fr] sm:items-center">
        <div>
          <div className="text-xs text-muted-foreground">Total geral</div>
          <div className="text-lg font-bold text-primary">
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-semibold ${totalTone}`}
            >
              {currencyFormatter.format(totalGeral)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="outline">{stats.total} itens</Badge>
        </div>
      </div>
    </div>
  );
};

export default TotalsBar;
