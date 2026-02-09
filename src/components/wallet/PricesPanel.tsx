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
    <Card className="financial-card p-4 sm:p-6">
      <CardHeader className="p-0 pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Ultimos precos (cache 1x/dia)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 text-left font-medium sm:py-1.5">Ticker</th>
              <th className="py-1 text-right font-medium sm:py-1.5">Preco</th>
              <th className="py-1 text-right font-medium sm:py-1.5">Origem</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {rows.map((row) => (
              <tr key={row.symbol} className="border-t border-border/50">
                <td className="py-1 sm:py-1.5">{row.symbol}</td>
                <td className="py-1 text-right sm:py-1.5">
                  {row.price == null
                    ? "-"
                    : new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(row.price)}
                </td>
                <td className="py-1 text-right sm:py-1.5">{row.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
