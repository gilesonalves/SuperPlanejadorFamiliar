import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { usePortfolio } from "@/hooks/usePortfolio";
import { getCachedDailyQuote } from "@/services/storage";

type CachedQuote = {
  regularMarketPrice?: number;
};

export default function PricesPanel() {
  const { state } = usePortfolio();
  const rows = useMemo(() => {
    const uniqueSymbols = Array.from(new Set(state.portfolio.map((item) => item.symbol))).slice(0, 20);
    return uniqueSymbols.map((symbol) => {
      const quote = getCachedDailyQuote(symbol) as CachedQuote | null;
      return {
        symbol,
        price: quote?.regularMarketPrice ?? null,
        when: quote ? "hoje" : "-",
      };
    });
  }, [state.portfolio]);

  if (!rows.length) return null;

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle>Ultimos Precos (cache 1x/dia)</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="min-w-[480px] w-full text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 text-left">Ticker</th>
              <th className="py-1 text-right">Preco</th>
              <th className="py-1 text-right">Origem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-t border-border/50">
                <td className="py-1">{row.symbol}</td>
                <td className="py-1 text-right">
                  {row.price == null
                    ? "-"
                    : new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(row.price)}
                </td>
                <td className="py-1 text-right">{row.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
