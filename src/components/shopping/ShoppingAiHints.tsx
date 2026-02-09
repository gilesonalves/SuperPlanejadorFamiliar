import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShoppingAIHints } from "@/hooks/useShoppingAIHints";

const ShoppingAiHints = () => {
  const { advice, error, loading, requestHints, clearError } = useShoppingAIHints();
  const [promptInput, setPromptInput] = useState("");

  const handleGenerate = () => {
    requestHints(promptInput);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label>Consulta culinária</Label>
          <Input
            type="text"
            value={promptInput}
            onChange={(event) => {
              setPromptInput(event.target.value);
              if (error) clearError();
            }}
            placeholder="Digite um prato, ingrediente ou pergunta"
          />
        </div>
        <Button type="button" onClick={handleGenerate} disabled={loading}>
          {loading ? "Gerando..." : "Gerar dica"}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {advice ? (
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm leading-relaxed break-words whitespace-pre-wrap sm:text-base">
          {advice}
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Esta é apenas uma sugestão culinária, não uma recomendação profissional.
      </p>
    </div>
  );
};

export default ShoppingAiHints;
