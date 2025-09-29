
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { ShoppingCategory } from "@/services/shopping/types";
import { getIcon } from "./icons";

type Props = {
  categories: ShoppingCategory[];
  getTotalByCategory: (id: string) => number;
  totalGeral: number;
  stats: { total: number; pendentes: number; carrinho: number; comprados: number };
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const TotalsBar = ({ categories, getTotalByCategory, totalGeral, stats }: Props) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle className="text-lg">Totais</CardTitle>
      <p className="text-sm text-muted-foreground">
        Acompanhe a distribuicao dos gastos por categoria e o progresso das compras
      </p>
    </CardHeader>
    <CardContent className="space-y-6">
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold">Total geral:</div>
        <div className="text-lg font-bold text-primary">{currencyFormatter.format(totalGeral)}</div>
        <Separator orientation="vertical" className="h-5" />
        <Badge variant="outline">{stats.total} itens</Badge>
        <Badge variant="secondary">{stats.pendentes} pendentes</Badge>
        <Badge variant="outline">{stats.carrinho} no carrinho</Badge>
        <Badge variant="outline" className="border-success/50 text-success">
          {stats.comprados} comprados
        </Badge>
      </div>
    </CardContent>
  </Card>
);

export default TotalsBar;
