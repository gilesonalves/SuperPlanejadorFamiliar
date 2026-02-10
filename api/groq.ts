import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:8080",
  "https://app.heygar.com.br",
];
const LIMIT_PREFIX = "groq:limit:";

type GroqMessage = {
  role: "system" | "user";
  content: string;
};

type InvestmentAiPortfolioItem = {
  symbol: string;
  name?: string;
  sector?: string;
  assetClass: "FII" | "ACAO" | "CRYPTO";
  qty: number;
  price: number;
  totalValue: number;
};

type InvestmentAiInput = {
  items: InvestmentAiPortfolioItem[];
  totalValue: number;
  allocationPct: {
    fii: number;
    acao: number;
    crypto: number;
  };
  availableAmount: number;
  riskProfile: "conservador" | "moderado" | "arrojado";
  goal: "crescimento" | "renda-passiva" | "preservacao";
  baseCurrency: "BRL";
  sectorSummary: Array<{ sector: string; pct: number }>;
};

type GroqProxyRequest =
  | { kind: "investment_tips"; input: InvestmentAiInput }
  | { kind: "shopping_hints"; input: string };

type GroqProxyResponse = {
  content?: string;
  error?: string;
  message?: string;
};

type GroqUpstreamResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

const dailyLimits = new Map<string, number>();

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

const goalLabels: Record<InvestmentAiInput["goal"], string> = {
  crescimento: "Crescimento",
  "renda-passiva": "Renda passiva",
  preservacao: "Preservacao de capital",
};

const riskLabels: Record<InvestmentAiInput["riskProfile"], string> = {
  conservador: "Conservador",
  moderado: "Moderado",
  arrojado: "Arrojado",
};

function buildInvestmentPrompt(input: InvestmentAiInput) {
  const items = input.items.slice(0, 30);
  const hasPortfolio = items.length > 0;
  const listLines = hasPortfolio
    ? items
        .map(
          (item) =>
            `- ${item.symbol}: ${item.qty} @ ${formatCurrency(item.price)} (total ${formatCurrency(item.totalValue)})`,
        )
        .join("\n")
    : "Usuario ainda nao possui investimentos cadastrados";

  const sectorLines = input.sectorSummary.length
    ? input.sectorSummary
        .map((row) => `- ${row.sector}: ${row.pct.toFixed(1)}%`)
        .join("\n")
    : "Sem dados de setor";

  return [
    `Valor disponivel para investir: ${formatCurrency(input.availableAmount)}`,
    "",
    `Perfil de risco: ${riskLabels[input.riskProfile] ?? "nao informado"}`,
    `Objetivo principal: ${goalLabels[input.goal] ?? "nao informado"}`,
    `Moeda base: ${input.baseCurrency}`,
    "",
    "Ativos atuais da carteira:",
    listLines,
    "",
    "Resumo por setor:",
    sectorLines,
    "",
    "Tarefa:",
    "- Gerar sugestoes de investimento educacionais.",
    "- Se a carteira estiver vazia, sugerir uma estrategia inicial simples.",
    "- Se houver ativos, sugerir diversificacao ou reforco.",
    "- Considerar o valor informado.",
    "- Considerar o perfil e objetivo quando disponiveis.",
  ].join("\n");
}

function buildShoppingPrompt(input: string) {
  return [
    `O usuario digitou: ${input}`,
    "",
    "Gere uma receita ou explicacao culinaria clara, com:",
    "- titulo da receita",
    "- ingredientes",
    "- modo de preparo",
    "- dicas opcionais (tempo, variacoes)",
    "",
    "Seja direto e didatico.",
  ].join("\n");
}

function getAllowedOrigins(): Set<string> {
  const extra = process.env.GROQ_ALLOWED_ORIGINS ?? "";
  const list = extra
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...list]);
}

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin && getAllowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-client-id, x-ai-action");
}

function getDailyLimit(): number {
  const raw = Number(process.env.GROQ_USER_DAILY_LIMIT);
  if (Number.isFinite(raw) && raw > 0) return raw;
  return 10;
}

function normalizeClientId(value: unknown): string {
  if (typeof value !== "string") return "anonymous";
  const trimmed = value.trim();
  if (!trimmed) return "anonymous";
  if (!/^[A-Za-z0-9._-]{1,64}$/.test(trimmed)) return "anonymous";
  return trimmed;
}

function maybeCleanupLimits() {
  if (dailyLimits.size < 2000) return;
  const today = new Date().toISOString().slice(0, 10);
  for (const key of dailyLimits.keys()) {
    if (!key.endsWith(`:${today}`)) {
      dailyLimits.delete(key);
    }
  }
}

function isInvestmentInput(input: unknown): input is InvestmentAiInput {
  if (!input || typeof input !== "object") return false;
  const obj = input as InvestmentAiInput;
  if (!Array.isArray(obj.items)) return false;
  if (obj.items.length > 40) return false;
  if (!obj.allocationPct || typeof obj.allocationPct !== "object") return false;
  if (!Array.isArray(obj.sectorSummary)) return false;
  if (obj.baseCurrency !== "BRL") return false;
  if (!obj.riskProfile || !obj.goal) return false;
  return true;
}

async function readBody(req: VercelRequest): Promise<GroqProxyRequest | null> {
  if (req.body && typeof req.body === "object") return req.body as GroqProxyRequest;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as GroqProxyRequest;
    } catch {
      return null;
    }
  }
  return null;
}

async function callGroq(messages: GroqMessage[], temperature: number, maxTokens: number) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { status: 500, body: { error: "missing_server_token", missing: "GROQ_API_KEY" } };
  }

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? "llama-3.1-8b-instant",
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });
  } catch {
    return {
      status: 503,
      body: { error: "upstream_unavailable", message: "Servico temporariamente indisponivel" },
    };
  }

  if (response.status === 401 || response.status === 403) {
    return {
      status: 401,
      body: { error: "not_configured", message: "IA nao configurada no ambiente." },
    };
  }

  if (response.status === 429) {
    return {
      status: 429,
      body: { error: "rate_limited", message: "Servico temporariamente indisponivel" },
    };
  }

  if (response.status >= 500) {
    return {
      status: 503,
      body: { error: "upstream_unavailable", message: "Servico temporariamente indisponivel" },
    };
  }

  const raw = (await response.json().catch(() => null)) as GroqUpstreamResponse | null;
  const content = raw?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { status: 502, body: { error: "invalid_upstream_response" } };
  }

  return { status: 200, body: { content } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const body = await readBody(req);
  if (!body || !body.kind) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  const actionHeader = req.headers["x-ai-action"];
  const shouldCountAction = actionHeader === "1" || actionHeader === "true";
  if (shouldCountAction) {
    const clientId = normalizeClientId(req.headers["x-client-id"]);
    const today = new Date().toISOString().slice(0, 10);
    const limit = getDailyLimit();
    const limitKey = `${LIMIT_PREFIX}${clientId}:${today}`;
    const current = dailyLimits.get(limitKey) ?? 0;
    if (current >= limit) {
      return res.status(429).json({
        error: "daily_limit",
        message: "Limite diario de IA atingido. Volte amanha.",
      });
    }
    dailyLimits.set(limitKey, current + 1);
    maybeCleanupLimits();
  }

  if (body.kind === "shopping_hints") {
    if (typeof body.input !== "string" || body.input.trim().length === 0) {
      return res.status(400).json({ error: "invalid_payload" });
    }
    if (body.input.length > 800) {
      return res.status(400).json({ error: "input_too_large" });
    }

    const messages: GroqMessage[] = [
      {
        role: "system",
        content: [
          "Voce e um assistente culinario.",
          "",
          "Regras importantes:",
          "- Gere receitas simples, claras e seguras.",
          "- Nunca de conselhos medicos.",
          "- Sempre responda em portugues do Brasil.",
          "",
          "Formato da resposta:",
          "- Titulo curto",
          "- Lista de ingredientes",
          "- Modo de preparo",
          "- Dicas opcionais (tempo, variacoes)",
        ].join("\n"),
      },
      {
        role: "user",
        content: buildShoppingPrompt(body.input),
      },
    ];

    const result = await callGroq(messages, 0.4, 600);
    return res.status(result.status).json(result.body);
  }

  if (!isInvestmentInput(body.input)) {
    return res.status(400).json({ error: "invalid_payload" });
  }

  const messages: GroqMessage[] = [
    {
      role: "system",
      content: [
        "Voce e um assistente financeiro educacional integrado ao app SuperPlanejador.",
        "",
        "Regras importantes:",
        "- Suas respostas NAO sao recomendacoes financeiras.",
        "- Todas as sugestoes sao apenas educacionais.",
        "- Sempre inclua um aviso de que o usuario deve avaliar seu perfil de risco ou consultar um profissional.",
        "",
        "Contexto do app:",
        "- Usuario pode ou nao ter investimentos cadastrados.",
        "- Usuario informa um valor disponivel para investir.",
        "- Usuario pode ter preferencias de carteira:",
        "  - Perfil de risco: Conservador, Moderado ou Arrojado",
        "  - Objetivo: Crescimento, Renda Passiva ou Preservacao",
        "  - Moeda base: BRL",
        "",
        "Seu papel:",
        "- Analisar a carteira atual (se existir).",
        "- Se nao houver ativos, sugerir uma estrategia inicial simples.",
        "- Distribuir o valor informado de forma logica e diversificada.",
        "- Usar linguagem clara, acessivel e em portugues do Brasil.",
        "- Evitar jargoes excessivos.",
        "- Estruturar a resposta em topicos curtos.",
        "",
        "Formato da resposta:",
        "- Titulo curto",
        "- Lista de sugestoes com valores aproximados",
        "- Pequena explicacao de cada item",
        "- Aviso legal no final",
      ].join("\n"),
    },
    {
      role: "user",
      content: buildInvestmentPrompt(body.input),
    },
  ];

  const result = await callGroq(messages, 0.3, 220);
  return res.status(result.status).json(result.body);
}
