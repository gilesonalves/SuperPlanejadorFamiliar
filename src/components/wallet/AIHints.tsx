import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvestmentAiTips } from "@/hooks/useInvestmentAiTips";

export default function AIHints() {
  const [amount, setAmount] = useState("");
  const [inputError, setInputError] = useState("");
  const { advice, error, loading, requestTips, hasPortfolio } = useInvestmentAiTips();
  const quickAmounts = [100, 300, 500];

  async function handleAsk() {
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setInputError("Informe um valor valido para investir.");
      return;
    }
    setInputError("");
    await requestTips(parsed);
  }

  const handleQuickStart = async (value: number) => {
    if (loading) return;
    setAmount(String(value));
    setInputError("");
    await requestTips(value);
  };

  return (
    <Card className="financial-card w-full p-4 sm:p-6">
      <CardHeader className="p-0 pb-3">
        <CardTitle>Dicas por IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label>Quanto você quer investir agora?</Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0,00"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                if (inputError) setInputError("");
              }}
              disabled={loading}
            />
          </div>
          <Button onClick={handleAsk} disabled={loading}>
            {loading ? "Gerando..." : "Gerar dica"}
          </Button>
        </div>

        {inputError ? <p className="text-sm text-destructive">{inputError}</p> : null}
        {!hasPortfolio ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem investimentos. Comece agora — a IA pode te ajudar.
          </p>
        ) : null}
        {!hasPortfolio ? (
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickStart(value)}
                disabled={loading}
              >
                Começar com R$ {value}
              </Button>
            ))}
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {advice ? (
          <>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap break-words text-base leading-relaxed md:text-sm max-h-[60vh] overflow-y-auto scroll-smooth md:max-h-none md:overflow-visible prose-p:my-2 prose-ul:my-2 prose-li:my-1">
              {advice}
            </div>
            <p className="text-xs text-muted-foreground opacity-80 leading-snug">
              ⚠️ Esta é apenas uma sugestão educacional. Não constitui recomendação de investimento.
              Avalie seu perfil ou consulte um profissional.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
