import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function SectorSummary() {
  const { state } = usePortfolio();
  const { rows, total } = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of state.portfolio) {
      const value = (Number(item.qty) || 0) * (Number(item.price) || 0);
      const key = (item.sector || "-").trim() || "-";
      map.set(key, (map.get(key) || 0) + value);
    }
    const totalValue = Array.from(map.values()).reduce((acc, value) => acc + value, 0);
    const rows = Array.from(map.entries())
      .map(([sector, value]) => ({
        sector,
        value,
        pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return { rows, total: totalValue };
  }, [state.portfolio]);

  if (!rows.length) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle>Resumo por Setor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.sector} className="grid grid-cols-12 items-center gap-2">
            <div className="col-span-4 text-sm">{row.sector}</div>
            <div className="col-span-6">
              <div className="h-2 overflow-hidden rounded bg-muted">
                <div className="h-2 bg-primary" style={{ width: `${row.pct}%` }} />
              </div>
            </div>
            <div className="col-span-2 text-right text-sm">{formatCurrency(row.value)}</div>
          </div>
        ))}
        <div className="text-right text-xs text-muted-foreground">Total {formatCurrency(total)}</div>
      </CardContent>
    </Card>
  );
}
