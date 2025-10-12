import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/usePortfolio";

export default function AIHints() {
  const { state } = usePortfolio();
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  async function handleAsk() {
    setLoading(true);
    try {
      const payload = state.portfolio.map((item) => ({
        symbol: item.symbol,
        class: item.assetClass,
        sector: item.sector,
        qty: item.qty,
        price: item.price,
      }));
      const response = await fetch("/api/ai-hints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: payload }),
      });
      if (!response.ok) throw new Error("Falha ao pedir dicas");
      const data = await response.json();
      setText(String(data?.advice || ""));
    } catch (error) {
      setText(error instanceof Error ? error.message : "Nao foi possivel obter dicas agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="financial-card">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Dicas por IA</CardTitle>
        <Button size="sm" onClick={handleAsk} disabled={loading}>
          {loading ? "Gerando..." : "Gerar dicas"}
        </Button>
      </CardHeader>
      <CardContent>
        {!text ? (
          <p className="text-sm text-muted-foreground">
            Conecte um endpoint <code>/api/ai-hints</code> com Groq para gerar sugestões a partir da sua carteira.
          </p>
        ) : (
          <div className="prose prose-invert whitespace-pre-wrap text-sm">{text}</div>
        )}
      </CardContent>
    </Card>
  );
}
