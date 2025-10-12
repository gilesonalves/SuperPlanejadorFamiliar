import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY ausente" });
  }

  const { portfolio = [] } = (req.body as { portfolio?: unknown[] }) ?? {};

  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  const asText = (value: unknown, fallback = "-"): string => {
    if (typeof value === "string" && value.trim().length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return fallback;
  };

  const brief = (Array.isArray(portfolio) ? portfolio : [])
    .slice(0, 40)
    .map((entry) => {
      if (!isRecord(entry)) return "-:-(-) x- @-";
      const klass = asText(entry.class ?? entry.assetClass);
      const symbol = asText(entry.symbol);
      const sector = asText(entry.sector);
      const qty = asText(entry.qty ?? entry.quantity);
      const price = asText(entry.price ?? entry.preco);
      return `${klass}:${symbol}(${sector}) x${qty} @${price}`;
    })
    .join("; ");

  const prompt = `
Voce e um planejador financeiro. Dada a carteira: ${brief}.
1) Aponte concentracao por classe/setor.
2) Sinalize metas comuns (ex.: FIIs x Acoes x Crypto).
3) Sugira 2-3 acoes de balanceamento (alto nivel).
Responda em PT-BR, conciso e pratico.
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return res.status(500).json({ error: "Groq fail", detail });
  }

  const data = await response.json();
  const advice = data?.choices?.[0]?.message?.content || "";
  return res.status(200).json({ advice });
}
