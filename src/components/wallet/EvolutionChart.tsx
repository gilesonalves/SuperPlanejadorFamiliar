import { useMemo } from "react";
import { loadHistory } from "@/services/storage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EvolutionChart() {
  const data = useMemo(() => loadHistory(), []);
  if (!data.length) return null;

  const performance = useMemo(() => {
    if (data.length < 2) return null;
    const first = data[0]?.total ?? 0;
    const last = data[data.length - 1]?.total ?? 0;
    if (first <= 0 || !Number.isFinite(first) || !Number.isFinite(last)) return null;
    const change = ((last - first) / first) * 100;
    return {
      change,
      isPositive: change >= 0,
    };
  }, [data]);

  const changeLabel =
    performance && performance.isPositive
      ? `+${performance.change.toFixed(1)}%`
      : performance
        ? `${performance.change.toFixed(1)}%`
        : "";

  return (
    <Card className="financial-card px-2">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Evolucao da Carteira</CardTitle>
        <div className="text-xs text-muted-foreground">
          Evolucao ultimos 30 dias{" "}
          {performance ? (
            <span className={performance.isPositive ? "text-success" : "text-destructive"}>
              {performance.isPositive ? "▲" : "▼"} {changeLabel}
            </span>
          ) : (
            <span>Sem historico suficiente</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-64 px-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
              }
            />
            <Line type="monotone" dataKey="total" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
