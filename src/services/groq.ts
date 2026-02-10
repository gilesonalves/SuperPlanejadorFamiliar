import { getClientId } from "@/services/clientId";

type AssetClass = "FII" | "ACAO" | "CRYPTO";

export type InvestmentAiPortfolioItem = {
  symbol: string;
  name?: string;
  sector?: string;
  assetClass: AssetClass;
  qty: number;
  price: number;
  totalValue: number;
};

export type InvestmentAiInput = {
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

type GroqProxyResponse = {
  content?: string;
  error?: string;
  message?: string;
};

const GROQ_PROXY_URL = "/api/groq";

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-client-id": getClientId(),
    "x-ai-action": "1",
  };
}

export async function requestInvestmentTips(input: InvestmentAiInput): Promise<string> {
  let response: Response;
  try {
    response = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ kind: "investment_tips", input }),
    });
  } catch (error) {
    const err = new Error("Falha ao conectar com a IA") as Error & { cause?: unknown };
    err.cause = error;
    throw err;
  }

  const raw = (await response.json().catch(() => null)) as GroqProxyResponse | null;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || raw?.error === "missing_server_token") {
      throw new Error("IA não configurada no ambiente.");
    }
    if (response.status === 429 || response.status >= 500) {
      throw new Error("Serviço temporariamente indisponível");
    }
    throw new Error("Falha ao conectar com a IA");
  }

  const content = raw?.content?.trim();
  if (!content) {
    throw new Error("Serviço temporariamente indisponível");
  }
  return content;
}

export async function requestShoppingHints(input: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(GROQ_PROXY_URL, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ kind: "shopping_hints", input }),
    });
  } catch (error) {
    const err = new Error("Falha ao conectar com a IA") as Error & { cause?: unknown };
    err.cause = error;
    throw err;
  }

  const raw = (await response.json().catch(() => null)) as GroqProxyResponse | null;
  if (!response.ok) {
    if (response.status === 401 || response.status === 403 || raw?.error === "missing_server_token") {
      throw new Error("IA não configurada no ambiente.");
    }
    if (response.status === 429 || response.status >= 500) {
      throw new Error("Serviço temporariamente indisponível");
    }
    throw new Error("Falha ao conectar com a IA");
  }

  const content = raw?.content?.trim();
  if (!content) {
    throw new Error("Serviço temporariamente indisponível");
  }
  return content;
}
