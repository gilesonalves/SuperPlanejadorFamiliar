import { useCallback, useState } from "react";
import { requestShoppingHints } from "@/services/groq";

export function useShoppingAIHints() {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [error, setError] = useState("");

  const clearError = useCallback(() => setError(""), []);

  const requestHints = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) {
        setAdvice("");
        setError("Digite um prato, ingrediente ou pergunta.");
        return;
      }
      if (loading) return;
      setLoading(true);
      setError("");

      try {
        const result = await requestShoppingHints(trimmed);
        setAdvice(result);
      } catch (err) {
        console.error("Shopping AI hints failed", err);
        setAdvice("");
        const message = err instanceof Error ? err.message : "";
        if (
          message === "IA não configurada no ambiente." ||
          message === "Falha ao conectar com a IA" ||
          message === "Serviço temporariamente indisponível"
        ) {
          setError(message);
        } else {
          setError("Falha ao conectar com a IA");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  return {
    advice,
    error,
    loading,
    requestHints,
    clearError,
  };
}
